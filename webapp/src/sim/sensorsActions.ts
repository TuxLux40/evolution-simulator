// Port of sensors-actions.h. All 21 sensors are always available (matches the
// upstream default build). Unlike upstream, KILL_FORWARD is always addressable
// by the genome (not compiled out) and its effect is gated at runtime by the
// killEnable parameter -- this lets the web UI toggle killing on/off without a
// rebuild, which is the whole point of an interactive tool.

export const SENSOR_MIN = 0.0;
export const SENSOR_MAX = 1.0;

export const NEURON_MIN = -1.0;
export const NEURON_MAX = 1.0;

export const ACTION_MIN = 0.0;
export const ACTION_MAX = 1.0;

// Plain const objects instead of TS `enum` (project is built with
// erasableSyntaxOnly, which disallows enums since they emit runtime code
// that can't be safely inlined per-file by esbuild).
export const Sensor = {
  LOC_X: 0,
  LOC_Y: 1,
  BOUNDARY_DIST_X: 2,
  BOUNDARY_DIST: 3,
  BOUNDARY_DIST_Y: 4,
  GENETIC_SIM_FWD: 5,
  LAST_MOVE_DIR_X: 6,
  LAST_MOVE_DIR_Y: 7,
  LONGPROBE_POP_FWD: 8,
  LONGPROBE_BAR_FWD: 9,
  POPULATION: 10,
  POPULATION_FWD: 11,
  POPULATION_LR: 12,
  OSC1: 13,
  AGE: 14,
  BARRIER_FWD: 15,
  BARRIER_LR: 16,
  RANDOM: 17,
  SIGNAL0: 18,
  SIGNAL0_FWD: 19,
  SIGNAL0_LR: 20,
  NUM_SENSES: 21,
} as const;
export type Sensor = (typeof Sensor)[keyof typeof Sensor];

export const Action = {
  MOVE_X: 0,
  MOVE_Y: 1,
  MOVE_FORWARD: 2,
  MOVE_RL: 3,
  MOVE_RANDOM: 4,
  SET_OSCILLATOR_PERIOD: 5,
  SET_LONGPROBE_DIST: 6,
  SET_RESPONSIVENESS: 7,
  EMIT_SIGNAL0: 8,
  MOVE_EAST: 9,
  MOVE_WEST: 10,
  MOVE_NORTH: 11,
  MOVE_SOUTH: 12,
  MOVE_LEFT: 13,
  MOVE_RIGHT: 14,
  MOVE_REVERSE: 15,
  KILL_FORWARD: 16,
  NUM_ACTIONS: 17,
} as const;
export type Action = (typeof Action)[keyof typeof Action];

export const SENSOR_NAMES: Record<Sensor, string> = {
  [Sensor.LOC_X]: 'loc X',
  [Sensor.LOC_Y]: 'loc Y',
  [Sensor.BOUNDARY_DIST_X]: 'boundary dist X',
  [Sensor.BOUNDARY_DIST]: 'boundary dist',
  [Sensor.BOUNDARY_DIST_Y]: 'boundary dist Y',
  [Sensor.GENETIC_SIM_FWD]: 'genetic similarity fwd',
  [Sensor.LAST_MOVE_DIR_X]: 'last move dir X',
  [Sensor.LAST_MOVE_DIR_Y]: 'last move dir Y',
  [Sensor.LONGPROBE_POP_FWD]: 'long probe population fwd',
  [Sensor.LONGPROBE_BAR_FWD]: 'long probe barrier fwd',
  [Sensor.POPULATION]: 'population density',
  [Sensor.POPULATION_FWD]: 'population fwd',
  [Sensor.POPULATION_LR]: 'population L-R',
  [Sensor.OSC1]: 'oscillator',
  [Sensor.AGE]: 'age',
  [Sensor.BARRIER_FWD]: 'barrier fwd',
  [Sensor.BARRIER_LR]: 'barrier L-R',
  [Sensor.RANDOM]: 'random',
  [Sensor.SIGNAL0]: 'pheromone density',
  [Sensor.SIGNAL0_FWD]: 'pheromone fwd',
  [Sensor.SIGNAL0_LR]: 'pheromone L-R',
  [Sensor.NUM_SENSES]: '',
};

export const ACTION_NAMES: Record<Action, string> = {
  [Action.MOVE_X]: 'move X',
  [Action.MOVE_Y]: 'move Y',
  [Action.MOVE_FORWARD]: 'move forward',
  [Action.MOVE_RL]: 'move R-L',
  [Action.MOVE_RANDOM]: 'move random',
  [Action.SET_OSCILLATOR_PERIOD]: 'set oscillator period',
  [Action.SET_LONGPROBE_DIST]: 'set long probe dist',
  [Action.SET_RESPONSIVENESS]: 'set responsiveness',
  [Action.EMIT_SIGNAL0]: 'emit pheromone',
  [Action.MOVE_EAST]: 'move east',
  [Action.MOVE_WEST]: 'move west',
  [Action.MOVE_NORTH]: 'move north',
  [Action.MOVE_SOUTH]: 'move south',
  [Action.MOVE_LEFT]: 'move left',
  [Action.MOVE_RIGHT]: 'move right',
  [Action.MOVE_REVERSE]: 'move reverse',
  [Action.KILL_FORWARD]: 'kill forward',
  [Action.NUM_ACTIONS]: '',
};
