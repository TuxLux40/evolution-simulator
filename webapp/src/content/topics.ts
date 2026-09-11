export const TOPIC_ORDER = [
  'naturalSelection',
  'genotypePhenotype',
  'mutation',
  'reproduction',
  'selectionPressure',
  'geneticDrift',
  'neuroevolution',
  'stigmergy',
  'kinSelection',
  'adaptation',
  'bottleneck',
] as const;

export type TopicKey = (typeof TOPIC_ORDER)[number];
