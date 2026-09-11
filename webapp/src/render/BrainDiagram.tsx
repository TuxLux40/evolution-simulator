import { SOURCE_SENSOR, SINK_ACTION, weightAsFloat } from '../sim/genome';
import { SENSOR_NAMES, ACTION_NAMES, type Sensor, type Action } from '../sim/sensorsActions';
import type { Gene } from '../sim/genome';
import type { NeuralNetNeuron } from '../sim/genome';

interface BrainDiagramProps {
  connections: Gene[];
  neurons: NeuralNetNeuron[];
}

const ROW_HEIGHT = 22;
const COL_X = { sensor: 8, sensorNode: 130, neuron: 260, actionNode: 390, action: 412 };
const WIDTH = 460;

export function BrainDiagram({ connections, neurons }: BrainDiagramProps) {
  const usedSensors = [...new Set(connections.filter((c) => c.sourceType === SOURCE_SENSOR).map((c) => c.sourceNum as Sensor))].sort((a, b) => a - b);
  const usedActions = [...new Set(connections.filter((c) => c.sinkType === SINK_ACTION).map((c) => c.sinkNum as Action))].sort((a, b) => a - b);

  const rows = Math.max(usedSensors.length, neurons.length, usedActions.length, 1);
  const height = rows * ROW_HEIGHT + 24;

  const sensorY = new Map(usedSensors.map((s, i) => [s, 16 + i * ROW_HEIGHT]));
  const neuronY = new Map(neurons.map((_, i) => [i, 16 + i * ROW_HEIGHT]));
  const actionY = new Map(usedActions.map((a, i) => [a, 16 + i * ROW_HEIGHT]));

  if (connections.length === 0) {
    return <p className="hint">This creature's genome produced no functioning connections (a dead-end brain) -- it can't sense or act.</p>;
  }

  return (
    <svg width="100%" viewBox={`0 0 ${WIDTH} ${height}`} className="brain-diagram" role="img" aria-label="Neural net diagram">
      {connections.map((c, i) => {
        const x1 = c.sourceType === SOURCE_SENSOR ? COL_X.sensorNode : COL_X.neuron;
        const y1 = c.sourceType === SOURCE_SENSOR ? sensorY.get(c.sourceNum as Sensor) : neuronY.get(c.sourceNum);
        const x2 = c.sinkType === SINK_ACTION ? COL_X.actionNode : COL_X.neuron;
        const y2 = c.sinkType === SINK_ACTION ? actionY.get(c.sinkNum as Action) : neuronY.get(c.sinkNum);
        if (y1 === undefined || y2 === undefined) return null;
        const w = weightAsFloat(c);
        const positive = w >= 0;
        const strokeWidth = Math.min(4, 0.5 + Math.abs(w) * 1.5);
        const isSelfLoop = c.sourceType === 0 && c.sinkType === 0 && c.sourceNum === c.sinkNum;
        if (isSelfLoop) {
          return (
            <path
              key={i}
              d={`M ${x1 + 4} ${y1 - 6} C ${x1 + 20} ${y1 - 16}, ${x1 + 20} ${y1 + 16}, ${x1 + 4} ${y1 + 6}`}
              fill="none"
              stroke={positive ? '#4ade80' : '#f87171'}
              strokeWidth={strokeWidth}
              opacity={0.8}
            />
          );
        }
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={positive ? '#4ade80' : '#f87171'}
            strokeWidth={strokeWidth}
            opacity={0.55}
          />
        );
      })}

      {usedSensors.map((s) => (
        <g key={`s${s}`}>
          <circle cx={COL_X.sensorNode} cy={sensorY.get(s)} r={4} fill="#38bdf8" />
          <text x={COL_X.sensor} y={(sensorY.get(s) ?? 0) + 4} fontSize={10} fill="#cbd5e1" textAnchor="start">
            {SENSOR_NAMES[s]}
          </text>
        </g>
      ))}

      {neurons.map((n, i) => (
        <g key={`n${i}`}>
          <circle cx={COL_X.neuron} cy={neuronY.get(i)} r={7} fill={n.driven ? '#a78bfa' : '#4b5563'} stroke="#e5e7eb" strokeWidth={0.5} />
          <text x={COL_X.neuron} y={(neuronY.get(i) ?? 0) + 3} fontSize={8} fill="#0b1220" textAnchor="middle">
            {n.output.toFixed(1)}
          </text>
        </g>
      ))}

      {usedActions.map((a) => (
        <g key={`a${a}`}>
          <circle cx={COL_X.actionNode} cy={actionY.get(a)} r={4} fill="#fbbf24" />
          <text x={COL_X.action} y={(actionY.get(a) ?? 0) + 4} fontSize={10} fill="#cbd5e1" textAnchor="start">
            {ACTION_NAMES[a]}
          </text>
        </g>
      ))}
    </svg>
  );
}
