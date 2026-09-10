// Runtime-tunable simulation parameters, ported from biosim4.ini / params.h.
// Every field here is meant to be adjustable from the web UI.

// Plain const object instead of TS `enum` (erasableSyntaxOnly build).
export const Challenge = {
  CIRCLE: 0,
  RIGHT_HALF: 1,
  RIGHT_QUARTER: 2,
  STRING: 3,
  CENTER_WEIGHTED: 4,
  CORNER: 5,
  CORNER_WEIGHTED: 6,
  MIGRATE_DISTANCE: 7,
  CENTER_SPARSE: 8,
  LEFT_EIGHTH: 9,
  RADIOACTIVE_WALLS: 10,
  AGAINST_ANY_WALL: 11,
  TOUCH_ANY_WALL: 12,
  EAST_WEST_EIGHTHS: 13,
  NEAR_BARRIER: 14,
  PAIRS: 15,
  LOCATION_SEQUENCE: 16,
  ALTRUISM: 17,
  CENTER_UNWEIGHTED: 40,
} as const;
export type Challenge = (typeof Challenge)[keyof typeof Challenge];

export const CHALLENGE_LABELS: Record<Challenge, string> = {
  [Challenge.CIRCLE]: 'Circle (west quadrant)',
  [Challenge.RIGHT_HALF]: 'Right half',
  [Challenge.RIGHT_QUARTER]: 'Right quarter',
  [Challenge.STRING]: 'Neighbor count (string)',
  [Challenge.CENTER_WEIGHTED]: 'Center, weighted',
  [Challenge.CENTER_UNWEIGHTED]: 'Center, unweighted',
  [Challenge.CORNER]: 'Any corner',
  [Challenge.CORNER_WEIGHTED]: 'Any corner, weighted',
  [Challenge.MIGRATE_DISTANCE]: 'Migrate distance',
  [Challenge.CENTER_SPARSE]: 'Center, sparse',
  [Challenge.LEFT_EIGHTH]: 'Left eighth',
  [Challenge.RADIOACTIVE_WALLS]: 'Radioactive walls',
  [Challenge.AGAINST_ANY_WALL]: 'Against any wall',
  [Challenge.TOUCH_ANY_WALL]: 'Touch any wall, ever',
  [Challenge.EAST_WEST_EIGHTHS]: 'East-West eighths',
  [Challenge.NEAR_BARRIER]: 'Near a barrier',
  [Challenge.PAIRS]: 'Pairs',
  [Challenge.LOCATION_SEQUENCE]: 'Visit barriers in sequence',
  [Challenge.ALTRUISM]: 'Altruism (sacrifice zone)',
};

// Plain const object instead of TS `enum` (erasableSyntaxOnly build).
export const BarrierType = {
  NONE: 0,
  VERTICAL_BAR_CONSTANT: 1,
  VERTICAL_BAR_RANDOM: 2,
  FIVE_STAGGERED_BLOCKS: 3,
  HORIZONTAL_BAR: 4,
  FLOATING_ISLAND: 5,
  SPOTS: 6,
} as const;
export type BarrierType = (typeof BarrierType)[keyof typeof BarrierType];

export const BARRIER_LABELS: Record<BarrierType, string> = {
  [BarrierType.NONE]: 'None',
  [BarrierType.VERTICAL_BAR_CONSTANT]: 'Vertical bar (fixed)',
  [BarrierType.VERTICAL_BAR_RANDOM]: 'Vertical bar (random)',
  [BarrierType.FIVE_STAGGERED_BLOCKS]: 'Five staggered blocks',
  [BarrierType.HORIZONTAL_BAR]: 'Horizontal bar',
  [BarrierType.FLOATING_ISLAND]: 'Floating island (moves each gen)',
  [BarrierType.SPOTS]: 'Sequence of spots',
};

export type ComputeBackend = 'cpu' | 'gpu';

export interface SimParams {
  sizeX: number;
  sizeY: number;
  population: number;
  stepsPerGeneration: number;
  genomeInitialLength: number;
  genomeMaxLength: number;
  maxNumberNeurons: number;
  pointMutationRate: number;
  geneInsertionDeletionRate: number;
  sexualReproduction: boolean;
  chooseParentsByFitness: boolean;
  killEnable: boolean;
  populationSensorRadius: number;
  signalSensorRadius: number;
  longProbeDistance: number;
  shortProbeBarrierDistance: number;
  responsivenessCurveKFactor: number;
  challenge: Challenge;
  barrierType: BarrierType;
  deterministic: boolean;
  rngSeed: number;
  computeBackend: ComputeBackend;
  stepsPerFrame: number; // how many simSteps to run per rendered frame (speed control)
}

export const DEFAULT_PARAMS: SimParams = {
  sizeX: 128,
  sizeY: 128,
  population: 1200,
  stepsPerGeneration: 300,
  genomeInitialLength: 24,
  genomeMaxLength: 300,
  maxNumberNeurons: 5,
  pointMutationRate: 0.001,
  geneInsertionDeletionRate: 0.0,
  sexualReproduction: true,
  chooseParentsByFitness: true,
  killEnable: false,
  populationSensorRadius: 2.5,
  signalSensorRadius: 2.0,
  longProbeDistance: 16,
  shortProbeBarrierDistance: 4,
  responsivenessCurveKFactor: 2,
  challenge: Challenge.CORNER_WEIGHTED,
  barrierType: BarrierType.NONE,
  deterministic: false,
  rngSeed: 12345678,
  computeBackend: 'cpu',
  stepsPerFrame: 1,
};
