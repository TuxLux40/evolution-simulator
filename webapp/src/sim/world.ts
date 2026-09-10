import type { Grid, Signals } from './grid';
import type { Indiv } from './individual';
import type { SimParams } from './params';
import type { Rng } from './random';

/** Shared read/write context passed to sensors, actions, and challenges. */
export interface SimWorld {
  grid: Grid;
  signals: Signals;
  individuals: Indiv[]; // index 0 unused, matches grid cell values
  params: SimParams;
  rng: Rng;
  simStep: number;
  deathQueue: number[];
  moveQueue: Array<{ index: number; newLoc: { x: number; y: number } }>;
}
