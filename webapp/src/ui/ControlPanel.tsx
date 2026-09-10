import { useState } from 'react';
import { type SimParams, type ComputeBackend, Challenge, CHALLENGE_LABELS, BarrierType, BARRIER_LABELS } from '../sim/params';
import { GPU_MAX_NEURONS } from '../sim/gpuFeedForward';

export type GpuStatus = 'checking' | 'available' | 'unavailable';

interface ControlPanelProps {
  params: SimParams;
  onLiveChange: (patch: Partial<SimParams>) => void;
  onApplyStructural: (patch: Partial<SimParams>) => void;
  gpuStatus: GpuStatus;
  onBackendChange: (backend: ComputeBackend) => void;
  running: boolean;
  onPlayPause: () => void;
  onStep: () => void;
  onResetRun: () => void;
  showPheromones: boolean;
  onTogglePheromones: (v: boolean) => void;
}

const STRUCTURAL_KEYS = [
  'sizeX',
  'sizeY',
  'population',
  'genomeInitialLength',
  'genomeMaxLength',
  'maxNumberNeurons',
  'deterministic',
  'rngSeed',
] as const;

type StructuralPatch = Pick<SimParams, (typeof STRUCTURAL_KEYS)[number]>;

export function ControlPanel(props: ControlPanelProps) {
  const { params, onLiveChange, onApplyStructural, gpuStatus, onBackendChange, running, onPlayPause, onStep, onResetRun, showPheromones, onTogglePheromones } =
    props;

  const [pending, setPending] = useState<StructuralPatch>({
    sizeX: params.sizeX,
    sizeY: params.sizeY,
    population: params.population,
    genomeInitialLength: params.genomeInitialLength,
    genomeMaxLength: params.genomeMaxLength,
    maxNumberNeurons: params.maxNumberNeurons,
    deterministic: params.deterministic,
    rngSeed: params.rngSeed,
  });

  const structuralDirty = STRUCTURAL_KEYS.some((k) => pending[k] !== params[k]);

  return (
    <div className="panel control-panel">
      <h2>Controls</h2>

      <div className="button-row">
        <button onClick={onPlayPause}>{running ? 'Pause' : 'Play'}</button>
        <button onClick={onStep} disabled={running}>
          Step
        </button>
        <button onClick={onResetRun} className="secondary">
          Restart run
        </button>
      </div>

      <label className="field">
        <span>Simulation speed ({params.stepsPerFrame} step{params.stepsPerFrame > 1 ? 's' : ''}/frame)</span>
        <input
          type="range"
          min={1}
          max={20}
          step={1}
          value={params.stepsPerFrame}
          onChange={(e) => onLiveChange({ stepsPerFrame: Number(e.target.value) })}
        />
      </label>

      <fieldset className="field-group">
        <legend>Compute backend</legend>
        <div className="button-row">
          <button className={params.computeBackend === 'cpu' ? 'active' : ''} onClick={() => onBackendChange('cpu')}>
            CPU
          </button>
          <button
            className={params.computeBackend === 'gpu' ? 'active' : ''}
            onClick={() => onBackendChange('gpu')}
            disabled={gpuStatus !== 'available'}
            title={gpuStatus === 'unavailable' ? 'WebGPU is not available in this browser' : 'Batches neural-net evaluation for the whole population on the GPU'}
          >
            GPU {gpuStatus === 'checking' ? '(checking…)' : gpuStatus === 'unavailable' ? '(unavailable)' : ''}
          </button>
        </div>
        <p className="hint">GPU batches every creature's neural-net evaluation into one compute dispatch per step. It pays off most at large populations; for small ones CPU is usually faster.</p>
      </fieldset>

      <fieldset className="field-group">
        <legend>Selection challenge</legend>
        <select value={params.challenge} onChange={(e) => onLiveChange({ challenge: Number(e.target.value) as Challenge })}>
          {Object.entries(CHALLENGE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <p className="hint">Determines which creatures survive to reproduce at the end of each generation. Takes effect next generation.</p>
      </fieldset>

      <fieldset className="field-group">
        <legend>Barriers</legend>
        <select value={params.barrierType} onChange={(e) => onLiveChange({ barrierType: Number(e.target.value) as BarrierType })}>
          {Object.entries(BARRIER_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </fieldset>

      <fieldset className="field-group">
        <legend>Genetics</legend>
        <label className="field">
          <span>Point mutation rate ({(params.pointMutationRate * 100).toFixed(2)}%)</span>
          <input
            type="range"
            min={0}
            max={0.05}
            step={0.0005}
            value={params.pointMutationRate}
            onChange={(e) => onLiveChange({ pointMutationRate: Number(e.target.value) })}
          />
        </label>
        <label className="field checkbox">
          <input type="checkbox" checked={params.sexualReproduction} onChange={(e) => onLiveChange({ sexualReproduction: e.target.checked })} />
          <span>Sexual reproduction (two parents)</span>
        </label>
        <label className="field checkbox">
          <input
            type="checkbox"
            checked={params.chooseParentsByFitness}
            onChange={(e) => onLiveChange({ chooseParentsByFitness: e.target.checked })}
          />
          <span>Bias parent choice by fitness</span>
        </label>
        <label className="field checkbox">
          <input type="checkbox" checked={params.killEnable} onChange={(e) => onLiveChange({ killEnable: e.target.checked })} />
          <span>Allow killing neighbors</span>
        </label>
      </fieldset>

      <fieldset className="field-group">
        <legend>Sensing</legend>
        <label className="field">
          <span>Population sensor radius ({params.populationSensorRadius.toFixed(1)})</span>
          <input
            type="range"
            min={0.5}
            max={10}
            step={0.5}
            value={params.populationSensorRadius}
            onChange={(e) => onLiveChange({ populationSensorRadius: Number(e.target.value) })}
          />
        </label>
        <label className="field">
          <span>Pheromone sensor radius ({params.signalSensorRadius.toFixed(1)})</span>
          <input
            type="range"
            min={0.5}
            max={10}
            step={0.5}
            value={params.signalSensorRadius}
            onChange={(e) => onLiveChange({ signalSensorRadius: Number(e.target.value) })}
          />
        </label>
        <label className="field checkbox">
          <input type="checkbox" checked={showPheromones} onChange={(e) => onTogglePheromones(e.target.checked)} />
          <span>Show pheromone overlay</span>
        </label>
      </fieldset>

      <fieldset className="field-group">
        <legend>World &amp; population (requires restart)</legend>
        <label className="field">
          <span>World width ({pending.sizeX})</span>
          <input
            type="range"
            min={32}
            max={256}
            step={8}
            value={pending.sizeX}
            onChange={(e) => setPending((p) => ({ ...p, sizeX: Number(e.target.value) }))}
          />
        </label>
        <label className="field">
          <span>World height ({pending.sizeY})</span>
          <input
            type="range"
            min={32}
            max={256}
            step={8}
            value={pending.sizeY}
            onChange={(e) => setPending((p) => ({ ...p, sizeY: Number(e.target.value) }))}
          />
        </label>
        <label className="field">
          <span>Population ({pending.population})</span>
          <input
            type="range"
            min={50}
            max={6000}
            step={50}
            value={pending.population}
            onChange={(e) => setPending((p) => ({ ...p, population: Number(e.target.value) }))}
          />
        </label>
        <label className="field">
          <span>Initial genome length ({pending.genomeInitialLength})</span>
          <input
            type="range"
            min={4}
            max={128}
            step={1}
            value={pending.genomeInitialLength}
            onChange={(e) => setPending((p) => ({ ...p, genomeInitialLength: Number(e.target.value) }))}
          />
        </label>
        <label className="field">
          <span>Max genome length ({pending.genomeMaxLength})</span>
          <input
            type="range"
            min={pending.genomeInitialLength}
            max={500}
            step={1}
            value={pending.genomeMaxLength}
            onChange={(e) => setPending((p) => ({ ...p, genomeMaxLength: Number(e.target.value) }))}
          />
        </label>
        <label className="field">
          <span>Max internal neurons ({pending.maxNumberNeurons})</span>
          <input
            type="range"
            min={0}
            max={GPU_MAX_NEURONS}
            step={1}
            value={pending.maxNumberNeurons}
            onChange={(e) => setPending((p) => ({ ...p, maxNumberNeurons: Number(e.target.value) }))}
          />
        </label>
        <label className="field checkbox">
          <input type="checkbox" checked={pending.deterministic} onChange={(e) => setPending((p) => ({ ...p, deterministic: e.target.checked }))} />
          <span>Deterministic (seeded) RNG</span>
        </label>
        {pending.deterministic && (
          <label className="field">
            <span>RNG seed</span>
            <input
              type="number"
              value={pending.rngSeed}
              onChange={(e) => setPending((p) => ({ ...p, rngSeed: Number(e.target.value) }))}
            />
          </label>
        )}
        <button className="primary" disabled={!structuralDirty} onClick={() => onApplyStructural(pending)}>
          Apply &amp; restart
        </button>
      </fieldset>
    </div>
  );
}
