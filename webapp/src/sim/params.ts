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
// Display labels for these live in src/i18n/translations.ts (challengeOption.<value>).

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
// Display labels for these live in src/i18n/translations.ts (barrierOption.<value>).

// A second, independent layer alongside barriers: patches of terrain with a
// temperature that speeds up or slows down movement instead of blocking it
// outright (stand-in for snow/mud/elevation -- cold is slow, hot is fast;
// literal 3D terrain isn't worth the rendering rewrite for what it'd add here).
export const TerrainType = {
  NONE: 0,
  GRADIENT: 1,
  COLD_PATCH_CENTER: 2,
  HOT_PATCH_CENTER: 3,
  ALTERNATING_BANDS: 4,
  RANDOM_SPOTS: 5,
} as const;
export type TerrainType = (typeof TerrainType)[keyof typeof TerrainType];
// Display labels for these live in src/i18n/translations.ts (terrainOption.<value>).

export type ComputeBackend = 'cpu' | 'gpu';

export interface SimParams {
  sizeX: number;
  sizeY: number;
  population: number;
  stepsPerGeneration: number;
  maxGenerations: number; // 0 = unlimited; run auto-pauses once reached
  genomeInitialLength: number;
  genomeMaxLength: number;
  maxNumberNeurons: number;
  pointMutationRate: number;
  geneInsertionDeletionRate: number;
  sexualReproduction: boolean;
  chooseParentsByFitness: boolean;
  killEnable: boolean;
  killUsesTrueRng: boolean; // kill decisions draw from a stream reseeded from drand instead of the run's PRNG
  populationSensorRadius: number;
  signalSensorRadius: number;
  longProbeDistance: number;
  shortProbeBarrierDistance: number;
  responsivenessCurveKFactor: number;
  challenge: Challenge;
  barrierType: BarrierType;
  terrainType: TerrainType;
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
  maxGenerations: 0,
  genomeInitialLength: 24,
  genomeMaxLength: 300,
  maxNumberNeurons: 5,
  pointMutationRate: 0.001,
  geneInsertionDeletionRate: 0.0,
  sexualReproduction: true,
  chooseParentsByFitness: true,
  killEnable: false,
  killUsesTrueRng: false,
  populationSensorRadius: 2.5,
  signalSensorRadius: 2.0,
  longProbeDistance: 16,
  shortProbeBarrierDistance: 4,
  responsivenessCurveKFactor: 2,
  challenge: Challenge.CORNER_WEIGHTED,
  barrierType: BarrierType.NONE,
  terrainType: TerrainType.NONE,
  deterministic: false,
  rngSeed: 12345678,
  computeBackend: 'cpu',
  stepsPerFrame: 1,
};
