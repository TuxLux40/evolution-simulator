// WebGPU compute backend: batches the whole population's neural-net
// feed-forward evaluation into a single compute dispatch per simStep,
// instead of walking each individual's connection list in a JS loop.
//
// Sensor readings still happen on the CPU each step (they need read access
// to the grid/signals/neighbor state, which is cheap per-individual but
// awkward to port into WGSL). What moves to the GPU is the actual weighted
// summation through each individual's private neural net -- the part that's
// embarrassingly parallel across the population and where a large population
// benefits most from GPU throughput. For small populations the CPU backend
// is typically faster since there's no dispatch/readback latency.
//
// Buffers are bit-packed to stay within the WebGPU-guaranteed minimum of 8
// storage buffers per shader stage: each connection is one u32 (source/sink
// type+index) plus one f32 weight; per-individual driven-neuron flags are a
// single u32 bitmask (maxNeurons is capped at 24, well under 32 bits).

import { getSensor } from './sensors';
import { weightAsFloat } from './genome';
import { Sensor, Action } from './sensorsActions';
import type { SimWorld } from './world';
import type { FeedForwardBackend } from './backend';
import type { ComputeBackend } from './params';

export const GPU_MAX_NEURONS = 24; // shader-side cap; UI clamps maxNumberNeurons to this
const NUM_SENSES = Sensor.NUM_SENSES;
const NUM_ACTIONS = Action.NUM_ACTIONS;

const SHADER_SRC = /* wgsl */ `
struct Uniforms {
  population: u32,
  maxNeurons: u32,
  numSenses: u32,
  numActions: u32,
};

@group(0) @binding(0) var<storage, read> connPacked: array<u32>;   // sourceType:1 | sourceNum:8 | sinkType:1 | sinkNum:8
@group(0) @binding(1) var<storage, read> connWeight: array<f32>;
@group(0) @binding(2) var<storage, read> connOffsetCount: array<u32>; // [offset0,count0,offset1,count1,...]
@group(0) @binding(3) var<storage, read> drivenFlags: array<u32>;   // bitmask per individual
@group(0) @binding(4) var<storage, read_write> neuronOutputs: array<f32>;
@group(0) @binding(5) var<storage, read> sensorValues: array<f32>;
@group(0) @binding(6) var<storage, read_write> actionLevels: array<f32>;
@group(0) @binding(7) var<storage, read> aliveFlags: array<u32>;
@group(0) @binding(8) var<uniform> uniforms: Uniforms;

const MAX_NEURONS: u32 = ${GPU_MAX_NEURONS}u;
const NUM_ACTIONS_CONST: u32 = ${NUM_ACTIONS}u;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let i = gid.x;
  if (i >= uniforms.population) { return; }
  if (aliveFlags[i] == 0u) { return; }

  var acc: array<f32, MAX_NEURONS>;
  for (var n: u32 = 0u; n < MAX_NEURONS; n = n + 1u) { acc[n] = 0.0; }
  var actionAcc: array<f32, NUM_ACTIONS_CONST>;
  for (var a: u32 = 0u; a < NUM_ACTIONS_CONST; a = a + 1u) { actionAcc[a] = 0.0; }

  let neuronBase = i * uniforms.maxNeurons;
  let sensorBase = i * uniforms.numSenses;
  let cOffset = connOffsetCount[i * 2u];
  let cCount = connOffsetCount[i * 2u + 1u];
  let driven = drivenFlags[i];
  var latched = false;

  for (var k: u32 = 0u; k < cCount; k = k + 1u) {
    let ci = cOffset + k;
    let packed = connPacked[ci];
    let sourceNum = packed & 0xFFu;
    let sourceType = (packed >> 8u) & 0x1u;
    let sinkNum = (packed >> 9u) & 0xFFu;
    let sinkType = (packed >> 17u) & 0x1u;

    if (sinkType == 1u && !latched) {
      for (var n: u32 = 0u; n < uniforms.maxNeurons; n = n + 1u) {
        if (((driven >> n) & 1u) != 0u) {
          neuronOutputs[neuronBase + n] = tanh(acc[n]);
        }
      }
      latched = true;
    }

    var inputVal: f32;
    if (sourceType == 1u) {
      inputVal = sensorValues[sensorBase + sourceNum];
    } else {
      inputVal = neuronOutputs[neuronBase + sourceNum];
    }

    let weighted = inputVal * connWeight[ci];
    if (sinkType == 1u) {
      actionAcc[sinkNum] = actionAcc[sinkNum] + weighted;
    } else {
      acc[sinkNum] = acc[sinkNum] + weighted;
    }
  }

  if (!latched) {
    for (var n: u32 = 0u; n < uniforms.maxNeurons; n = n + 1u) {
      if (((driven >> n) & 1u) != 0u) {
        neuronOutputs[neuronBase + n] = tanh(acc[n]);
      }
    }
  }

  let actionBase = i * uniforms.numActions;
  for (var a: u32 = 0u; a < uniforms.numActions; a = a + 1u) {
    actionLevels[actionBase + a] = actionAcc[a];
  }
}
`;

export async function isWebGpuAvailable(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('gpu' in navigator)) return false;
  try {
    const gpu = (navigator as Navigator & { gpu: GPU }).gpu;
    const adapter = await gpu.requestAdapter();
    return adapter !== null;
  } catch {
    return false;
  }
}

export class GpuFeedForwardBackend implements FeedForwardBackend {
  readonly kind: ComputeBackend = 'gpu';
  private device: GPUDevice | null = null;
  private pipeline: GPUComputePipeline | null = null;
  private ready: Promise<void>;

  // Per-generation buffers (rebuilt in prepareGeneration)
  private population = 0;
  private uniformBuffer: GPUBuffer | null = null;
  private connPackedBuffer: GPUBuffer | null = null;
  private connWeightBuffer: GPUBuffer | null = null;
  private connOffsetCountBuffer: GPUBuffer | null = null;
  private drivenFlagsBuffer: GPUBuffer | null = null;
  private neuronOutputsBuffer: GPUBuffer | null = null;
  private sensorValuesBuffer: GPUBuffer | null = null;
  private actionLevelsBuffer: GPUBuffer | null = null;
  private actionLevelsReadBuffer: GPUBuffer | null = null;
  private aliveFlagsBuffer: GPUBuffer | null = null;
  private bindGroup: GPUBindGroup | null = null;

  constructor() {
    this.ready = this.init();
  }

  private async init(): Promise<void> {
    const gpu = (navigator as Navigator & { gpu?: GPU }).gpu;
    if (!gpu) throw new Error('WebGPU not supported in this browser');
    const adapter = await gpu.requestAdapter();
    if (!adapter) throw new Error('No WebGPU adapter available');
    this.device = await adapter.requestDevice();
    const shaderModule = this.device.createShaderModule({ code: SHADER_SRC });
    this.pipeline = this.device.createComputePipeline({
      layout: 'auto',
      compute: { module: shaderModule, entryPoint: 'main' },
    });
  }

  async waitUntilReady(): Promise<void> {
    await this.ready;
  }

  private freeBuffers(): void {
    this.connPackedBuffer?.destroy();
    this.connWeightBuffer?.destroy();
    this.connOffsetCountBuffer?.destroy();
    this.drivenFlagsBuffer?.destroy();
    this.uniformBuffer?.destroy();
    this.neuronOutputsBuffer?.destroy();
    this.sensorValuesBuffer?.destroy();
    this.actionLevelsBuffer?.destroy();
    this.actionLevelsReadBuffer?.destroy();
    this.aliveFlagsBuffer?.destroy();
  }

  async prepareGeneration(world: SimWorld): Promise<void> {
    await this.ready;
    const device = this.device!;
    this.freeBuffers();

    const population = world.params.population;
    const maxNeurons = Math.min(world.params.maxNumberNeurons, GPU_MAX_NEURONS);
    this.population = population;

    const packed: number[] = [];
    const weight: number[] = [];
    const connOffsetCount = new Uint32Array(population * 2);
    const drivenFlags = new Uint32Array(population);

    for (let i = 0; i < population; i++) {
      const indiv = world.individuals[i + 1];
      connOffsetCount[i * 2] = packed.length;
      if (indiv && indiv.alive) {
        const nnet = indiv.nnet;
        connOffsetCount[i * 2 + 1] = nnet.connections.length;
        for (const c of nnet.connections) {
          const p = (c.sourceType << 8) | (c.sourceNum & 0xff) | (c.sinkType << 17) | ((c.sinkNum & 0xff) << 9);
          packed.push(p >>> 0);
          weight.push(weightAsFloat(c));
        }
        let mask = 0;
        for (let n = 0; n < Math.min(nnet.neurons.length, maxNeurons); n++) {
          if (nnet.neurons[n].driven) mask |= 1 << n;
        }
        drivenFlags[i] = mask >>> 0;
      }
    }

    const makeBuf = (arr: Uint32Array | Float32Array, usage: number): GPUBuffer => {
      const size = Math.max(arr.byteLength, 4);
      const buf = device.createBuffer({ size, usage, mappedAtCreation: true });
      new (arr.constructor as typeof Uint32Array | typeof Float32Array)(buf.getMappedRange()).set(arr as never);
      buf.unmap();
      return buf;
    };

    const STORAGE = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC;

    this.connPackedBuffer = makeBuf(new Uint32Array(packed), STORAGE);
    this.connWeightBuffer = makeBuf(new Float32Array(weight), STORAGE);
    this.connOffsetCountBuffer = makeBuf(connOffsetCount, STORAGE);
    this.drivenFlagsBuffer = makeBuf(drivenFlags, STORAGE);

    const initialNeuronOutputs = new Float32Array(population * maxNeurons).fill(0.5);
    this.neuronOutputsBuffer = makeBuf(initialNeuronOutputs, STORAGE);

    this.sensorValuesBuffer = device.createBuffer({
      size: Math.max(population * NUM_SENSES * 4, 4),
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    this.actionLevelsBuffer = device.createBuffer({
      size: Math.max(population * NUM_ACTIONS * 4, 4),
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });
    this.actionLevelsReadBuffer = device.createBuffer({
      size: Math.max(population * NUM_ACTIONS * 4, 4),
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });
    this.aliveFlagsBuffer = device.createBuffer({
      size: Math.max(population * 4, 4),
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    const uniformData = new Uint32Array([population, maxNeurons, NUM_SENSES, NUM_ACTIONS]);
    this.uniformBuffer = device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(this.uniformBuffer, 0, uniformData);

    this.bindGroup = device.createBindGroup({
      layout: this.pipeline!.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.connPackedBuffer } },
        { binding: 1, resource: { buffer: this.connWeightBuffer } },
        { binding: 2, resource: { buffer: this.connOffsetCountBuffer } },
        { binding: 3, resource: { buffer: this.drivenFlagsBuffer } },
        { binding: 4, resource: { buffer: this.neuronOutputsBuffer } },
        { binding: 5, resource: { buffer: this.sensorValuesBuffer } },
        { binding: 6, resource: { buffer: this.actionLevelsBuffer } },
        { binding: 7, resource: { buffer: this.aliveFlagsBuffer } },
        { binding: 8, resource: { buffer: this.uniformBuffer } },
      ],
    });
  }

  async evaluateStep(world: SimWorld): Promise<Float32Array[]> {
    const device = this.device!;
    const population = this.population;

    const sensorValues = new Float32Array(population * NUM_SENSES);
    const aliveFlags = new Uint32Array(population);
    for (let i = 0; i < population; i++) {
      const indiv = world.individuals[i + 1];
      if (!indiv || !indiv.alive) continue;
      aliveFlags[i] = 1;
      const base = i * NUM_SENSES;
      for (let s = 0; s < NUM_SENSES; s++) {
        sensorValues[base + s] = getSensor(world, indiv, s as Sensor);
      }
    }

    device.queue.writeBuffer(this.sensorValuesBuffer!, 0, sensorValues);
    device.queue.writeBuffer(this.aliveFlagsBuffer!, 0, aliveFlags);

    const encoder = device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    pass.setPipeline(this.pipeline!);
    pass.setBindGroup(0, this.bindGroup!);
    pass.dispatchWorkgroups(Math.ceil(population / 64));
    pass.end();
    encoder.copyBufferToBuffer(this.actionLevelsBuffer!, 0, this.actionLevelsReadBuffer!, 0, population * NUM_ACTIONS * 4);
    device.queue.submit([encoder.finish()]);

    await this.actionLevelsReadBuffer!.mapAsync(GPUMapMode.READ);
    const mapped = new Float32Array(this.actionLevelsReadBuffer!.getMappedRange());
    const results: Float32Array[] = new Array(population + 1);
    for (let i = 0; i < population; i++) {
      const indiv = world.individuals[i + 1];
      if (!indiv || !indiv.alive) continue;
      results[i + 1] = mapped.slice(i * NUM_ACTIONS, (i + 1) * NUM_ACTIONS);
    }
    this.actionLevelsReadBuffer!.unmap();
    return results;
  }

  dispose(): void {
    this.freeBuffers();
    this.device?.destroy();
  }
}
