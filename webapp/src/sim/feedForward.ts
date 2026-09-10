// Port of feedForward.cpp: evaluates one individual's neural net for one simStep.

import { getSensor } from './sensors';
import { weightAsFloat, SOURCE_SENSOR, SINK_ACTION } from './genome';
import { Action, type Sensor } from './sensorsActions';
import type { Indiv } from './individual';
import type { SimWorld } from './world';

export function feedForward(world: SimWorld, indiv: Indiv): Float32Array {
  const actionLevels = new Float32Array(Action.NUM_ACTIONS);
  const neuronAccumulators = new Float32Array(indiv.nnet.neurons.length);
  let neuronOutputsComputed = false;

  for (const conn of indiv.nnet.connections) {
    if (conn.sinkType === SINK_ACTION && !neuronOutputsComputed) {
      for (let i = 0; i < indiv.nnet.neurons.length; i++) {
        const neuron = indiv.nnet.neurons[i];
        if (neuron.driven) neuron.output = Math.tanh(neuronAccumulators[i]);
      }
      neuronOutputsComputed = true;
    }

    const inputVal =
      conn.sourceType === SOURCE_SENSOR ? getSensor(world, indiv, conn.sourceNum as Sensor) : indiv.nnet.neurons[conn.sourceNum].output;

    const weighted = inputVal * weightAsFloat(conn);
    if (conn.sinkType === SINK_ACTION) actionLevels[conn.sinkNum] += weighted;
    else neuronAccumulators[conn.sinkNum] += weighted;
  }

  return actionLevels;
}
