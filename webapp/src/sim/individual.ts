import type { Coord, Compass } from './geometry';
import type { Genome, NeuralNet } from './genome';

export interface Indiv {
  alive: boolean;
  index: number;
  uid: number; // stable identity across the whole run, unlike `index` (a reused array slot)
  generation: number;
  parentUids: [number, number] | null;
  loc: Coord;
  birthLoc: Coord;
  age: number;
  genome: Genome;
  nnet: NeuralNet;
  responsiveness: number; // 0..1
  oscPeriod: number;
  longProbeDist: number;
  lastMoveDir: Compass;
  challengeBits: number;
}
