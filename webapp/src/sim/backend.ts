// Pluggable feed-forward evaluation backend. CPU runs each individual's
// neural net in a plain JS loop; the GPU backend (gpuFeedForward.ts) batches
// the whole population's neural-net evaluation into one WebGPU compute
// dispatch per simStep.

import { feedForward } from './feedForward';
import { Action } from './sensorsActions';
import type { SimWorld } from './world';
import type { ComputeBackend } from './params';

export interface FeedForwardBackend {
  readonly kind: ComputeBackend;
  /** Called once per generation, after the new population's genomes/wiring are set. */
  prepareGeneration(world: SimWorld): void | Promise<void>;
  /** Evaluates all alive individuals for the current simStep. Index 0 is unused. */
  evaluateStep(world: SimWorld): Promise<Float32Array[]>;
  dispose(): void;
}

export class CpuFeedForwardBackend implements FeedForwardBackend {
  readonly kind: ComputeBackend = 'cpu';

  prepareGeneration(): void {
    // Nothing to precompute -- each individual's nnet is walked directly.
  }

  async evaluateStep(world: SimWorld): Promise<Float32Array[]> {
    const results: Float32Array[] = new Array(world.params.population + 1);
    for (let index = 1; index <= world.params.population; index++) {
      const indiv = world.individuals[index];
      if (!indiv.alive) continue;
      results[index] = feedForward(world, indiv);
    }
    return results;
  }

  dispose(): void {}
}

export const EMPTY_ACTION_LEVELS = new Float32Array(Action.NUM_ACTIONS);
