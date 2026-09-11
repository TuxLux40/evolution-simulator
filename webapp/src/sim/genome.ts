// Port of genome.cpp: gene/genome representation, random genome generation,
// neural-net wiring derivation (with useless-neuron culling), mutation, and
// sexual/asexual reproduction.

import { Rng } from './random';
import { Sensor, Action } from './sensorsActions';
import type { SimParams } from './params';

export const SOURCE_SENSOR = 1; // Gene.sourceType value meaning "sensor"
export const SOURCE_NEURON = 0; // Gene.sourceType value meaning "internal neuron"
export const SINK_ACTION = 1; // Gene.sinkType value meaning "action"
export const SINK_NEURON = 0; // Gene.sinkType value meaning "internal neuron"

export interface Gene {
  sourceType: 0 | 1;
  sourceNum: number; // 0..127 raw, renumbered/modulo'd into wiring
  sinkType: 0 | 1;
  sinkNum: number;
  weight: number; // int16 range -32768..32767
}

export type Genome = Gene[];

export function weightAsFloat(gene: Gene): number {
  return gene.weight / 8192.0;
}

function makeRandomWeight(rng: Rng): number {
  return rng.nextInt(0, 0xffff) - 0x8000;
}

export function makeRandomGene(rng: Rng): Gene {
  return {
    sourceType: (rng.nextUint32() & 1) as 0 | 1,
    sourceNum: rng.nextInt(0, 0x7f),
    sinkType: (rng.nextUint32() & 1) as 0 | 1,
    sinkNum: rng.nextInt(0, 0x7f),
    weight: makeRandomWeight(rng),
  };
}

export function makeRandomGenome(rng: Rng, length: number): Genome {
  const genome: Genome = [];
  for (let i = 0; i < length; i++) genome.push(makeRandomGene(rng));
  return genome;
}

export interface NeuralNetNeuron {
  output: number;
  driven: boolean;
  /** When true, feedForward leaves .output alone instead of recomputing it from inputs -- a manual "pin" from the creature inspector's neuron editor. */
  pinned: boolean;
}

export interface NeuralNet {
  connections: Gene[]; // renumbered: neuron-sink connections first, then action-sink
  neurons: NeuralNetNeuron[];
}

interface Node {
  remappedNumber: number;
  numOutputs: number;
  numSelfInputs: number;
  numInputsFromSensorsOrOtherNeurons: number;
}

const initialNeuronOutput = 0.5;

/** Converts an inherited genome into a pruned, renumbered neural net. */
export function createWiringFromGenome(genome: Genome, p: SimParams): NeuralNet {
  // Step 1: renumber raw gene source/sink indices into valid ranges.
  const connections: Gene[] = genome.map((g) => {
    const c: Gene = { ...g };
    if (c.sourceType === SOURCE_NEURON) c.sourceNum %= p.maxNumberNeurons;
    else c.sourceNum %= Sensor.NUM_SENSES;
    if (c.sinkType === SINK_NEURON) c.sinkNum %= p.maxNumberNeurons;
    else c.sinkNum %= Action.NUM_ACTIONS;
    return c;
  });

  // Step 2: build a node map of every referenced neuron, sorted by neuron number
  // (mirrors std::map<uint16_t, Node> iteration order in the original).
  const nodeMap = new Map<number, Node>();
  const getOrInsert = (n: number): Node => {
    let node = nodeMap.get(n);
    if (!node) {
      node = { remappedNumber: 0, numOutputs: 0, numSelfInputs: 0, numInputsFromSensorsOrOtherNeurons: 0 };
      nodeMap.set(n, node);
    }
    return node;
  };
  for (const c of connections) {
    if (c.sinkType === SINK_NEURON) {
      const node = getOrInsert(c.sinkNum);
      if (c.sourceType === SOURCE_NEURON && c.sourceNum === c.sinkNum) node.numSelfInputs++;
      else node.numInputsFromSensorsOrOtherNeurons++;
    }
    if (c.sourceType === SOURCE_NEURON) {
      getOrInsert(c.sourceNum).numOutputs++;
    }
  }

  // Step 3: iteratively cull neurons with no real outputs (numOutputs == numSelfInputs,
  // including 0), removing connections that feed them.
  let changed = true;
  while (changed) {
    changed = false;
    for (const [neuronNum, node] of [...nodeMap.entries()]) {
      if (node.numOutputs === node.numSelfInputs) {
        changed = true;
        for (let i = connections.length - 1; i >= 0; i--) {
          const c = connections[i];
          if (c.sinkType === SINK_NEURON && c.sinkNum === neuronNum) {
            if (c.sourceType === SOURCE_NEURON) {
              const src = nodeMap.get(c.sourceNum);
              if (src) src.numOutputs--;
            }
            connections.splice(i, 1);
          }
        }
        nodeMap.delete(neuronNum);
      }
    }
  }

  // Step 4: renumber surviving neurons sequentially starting at 0, in ascending
  // order of their original neuron number.
  const sortedKeys = [...nodeMap.keys()].sort((a, b) => a - b);
  sortedKeys.forEach((key, i) => {
    nodeMap.get(key)!.remappedNumber = i;
  });

  // Step 5: build the final connection list -- neuron-sink connections first
  // (so feed-forward can compute all neuron outputs before consuming them for
  // action outputs), then action-sink connections.
  const finalConnections: Gene[] = [];
  for (const c of connections) {
    if (c.sinkType === SINK_NEURON) {
      const newConn: Gene = { ...c, sinkNum: nodeMap.get(c.sinkNum)!.remappedNumber };
      if (newConn.sourceType === SOURCE_NEURON) newConn.sourceNum = nodeMap.get(c.sourceNum)!.remappedNumber;
      finalConnections.push(newConn);
    }
  }
  for (const c of connections) {
    if (c.sinkType === SINK_ACTION) {
      const newConn: Gene = { ...c };
      if (newConn.sourceType === SOURCE_NEURON) newConn.sourceNum = nodeMap.get(c.sourceNum)!.remappedNumber;
      finalConnections.push(newConn);
    }
  }

  const neurons: NeuralNetNeuron[] = sortedKeys.map((key) => ({
    output: initialNeuronOutput,
    driven: nodeMap.get(key)!.numInputsFromSensorsOrOtherNeurons !== 0,
    pinned: false,
  }));

  return { connections: finalConnections, neurons };
}

// ---------------------------------------------------------------------------
// Mutation & reproduction

function randomBitFlip(genome: Genome, rng: Rng): void {
  const elementIndex = rng.nextInt(0, genome.length - 1);
  const bit = 1 << rng.nextInt(0, 7);
  const chance = rng.nextFloat();
  const g = genome[elementIndex];
  if (chance < 0.2) g.sourceType = (g.sourceType ^ 1) as 0 | 1;
  else if (chance < 0.4) g.sinkType = (g.sinkType ^ 1) as 0 | 1;
  else if (chance < 0.6) g.sourceNum ^= bit;
  else if (chance < 0.8) g.sinkNum ^= bit;
  else g.weight = (g.weight ^ (1 << rng.nextInt(1, 15))) << 16 >> 16; // keep int16 semantics
}

function cropLength(genome: Genome, length: number, rng: Rng): void {
  if (genome.length > length && length > 0) {
    if (rng.chance(0.5)) {
      genome.splice(0, genome.length - length); // trim front
    } else {
      genome.length = length; // trim back
    }
  }
}

function randomInsertDeletion(genome: Genome, p: SimParams, rng: Rng): void {
  if (rng.chance(p.geneInsertionDeletionRate)) {
    if (rng.chance(0.5)) {
      if (genome.length > 1) genome.splice(rng.nextInt(0, genome.length - 1), 1);
    } else if (genome.length < p.genomeMaxLength) {
      genome.push(makeRandomGene(rng));
    }
  }
}

function applyPointMutations(genome: Genome, p: SimParams, rng: Rng): void {
  let n = genome.length;
  while (n-- > 0) {
    if (rng.chance(p.pointMutationRate)) randomBitFlip(genome, rng);
  }
}

export interface ParentCandidate {
  uid: number;
  genome: Genome;
}

export interface ChildGenomeResult {
  genome: Genome;
  parentUids: [number, number];
}

/** Combines one or two parent genomes (with mutation) into a child genome. */
export function generateChildGenome(parentGenomes: ParentCandidate[], p: SimParams, rng: Rng): ChildGenomeResult {
  let parent1Idx: number;
  let parent2Idx: number;

  if (p.chooseParentsByFitness && parentGenomes.length > 1) {
    // parentGenomes is sorted best-first; biasing parent1 toward the front
    // favors fitter parents while still allowing weaker ones a chance.
    parent1Idx = rng.nextInt(1, parentGenomes.length - 1);
    parent2Idx = rng.nextInt(0, parent1Idx - 1);
  } else {
    parent1Idx = rng.nextInt(0, parentGenomes.length - 1);
    parent2Idx = rng.nextInt(0, parentGenomes.length - 1);
  }

  const g1 = parentGenomes[parent1Idx].genome;
  const g2 = parentGenomes[parent2Idx].genome;

  let genome: Genome;

  if (p.sexualReproduction) {
    const [longer, shorter] = g1.length >= g2.length ? [g1, g2] : [g2, g1];
    genome = longer.map((g) => ({ ...g }));
    const index0 = rng.nextInt(0, shorter.length - 1);
    let index1 = rng.nextInt(0, shorter.length);
    let lo = index0;
    let hi = index1;
    if (lo > hi) [lo, hi] = [hi, lo];
    for (let i = lo; i < hi; i++) genome[i] = { ...shorter[i] };

    let sum = g1.length + g2.length;
    if (sum & 1 && rng.nextUint32() & 1) sum++;
    cropLength(genome, Math.floor(sum / 2), rng);
  } else {
    genome = g2.map((g) => ({ ...g }));
  }

  randomInsertDeletion(genome, p, rng);
  applyPointMutations(genome, p, rng);
  if (genome.length > p.genomeMaxLength) genome.length = p.genomeMaxLength;
  return { genome, parentUids: [parentGenomes[parent1Idx].uid, parentGenomes[parent2Idx].uid] };
}

function genesMatch(a: Gene, b: Gene): boolean {
  return (
    a.sinkNum === b.sinkNum &&
    a.sourceNum === b.sourceNum &&
    a.sinkType === b.sinkType &&
    a.sourceType === b.sourceType &&
    a.weight === b.weight
  );
}

/**
 * Similarity of two genomes in 0..1. Simplified from upstream's
 * Jaro-Winkler/Hamming methods: compares matching genes over the shared
 * length prefix, which is cheap and length-agnostic (genomes here can differ
 * in length after crossover).
 */
export function genomeSimilarity(g1: Genome, g2: Genome): number {
  const len = Math.min(g1.length, g2.length);
  if (len === 0) return 0;
  let matches = 0;
  for (let i = 0; i < len; i++) if (genesMatch(g1[i], g2[i])) matches++;
  return matches / len;
}

/** Hue-stable color-ish numeric fingerprint of a genome, used for rendering. */
export function genomeColorHash(genome: Genome): number {
  let hash = 0;
  for (const g of genome) {
    hash = (hash * 31 + g.sourceType * 7 + g.sourceNum * 13 + g.sinkType * 17 + g.sinkNum * 19 + (g.weight & 0xff)) | 0;
  }
  return hash >>> 0;
}
