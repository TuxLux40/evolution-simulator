import type { Coord, Compass } from './geometry';
import type { Genome, NeuralNet } from './genome';

export interface Indiv {
  alive: boolean;
  index: number;
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
