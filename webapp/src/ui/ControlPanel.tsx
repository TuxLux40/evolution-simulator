import { useEffect, useState } from 'react';
import {
  type SimParams,
  type ComputeBackend,
  Challenge,
  CHALLENGE_LABELS,
  BarrierType,
  BARRIER_LABELS,
  TerrainType,
  TERRAIN_LABELS,
} from '../sim/params';
import { GPU_MAX_NEURONS } from '../sim/gpuFeedForward';
import { SliderField } from './SliderField';

export type GpuStatus = 'checking' | 'available' | 'unavailable';

interface ControlPanelProps {
  params: SimParams;
  onLiveChange: (patch: Partial<SimParams>) => void;
  onApplyStructural: (patch: Partial<SimParams>) => void;
  onFetchTrueRandomSeed: () => Promise<void>;
  gpuStatus: GpuStatus;
  onBackendChange: (backend: ComputeBackend) => void;
  running: boolean;
  onPlayPause: () => void;
  onStep: () => void;
  onResetRun: () => void;
  showPheromones: boolean;
  onTogglePheromones: (v: boolean) => void;
  showSurvivorPreview: boolean;
  onToggleSurvivorPreview: (v: boolean) => void;
  onExportConfig: () => void;
  onExportStats: () => void;
  onExportSnapshot: () => void;
  isRecording: boolean;
  onToggleRecording: () => void;
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
  const {
    params,
    onLiveChange,
    onApplyStructural,
    onFetchTrueRandomSeed,
    gpuStatus,
    onBackendChange,
    running,
    onPlayPause,
    onStep,
    onResetRun,
    showPheromones,
    onTogglePheromones,
    showSurvivorPreview,
    onToggleSurvivorPreview,
    onExportConfig,
    onExportStats,
    onExportSnapshot,
    isRecording,
    onToggleRecording,
  } = props;

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
  const [rngFetchStatus, setRngFetchStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  // Structural params only ever change via an apply (this panel's own, or the
  // true-random-seed button) -- resync the form to reflect what actually committed.
  useEffect(() => {
    setPending({
      sizeX: params.sizeX,
      sizeY: params.sizeY,
      population: params.population,
      genomeInitialLength: params.genomeInitialLength,
      genomeMaxLength: params.genomeMaxLength,
      maxNumberNeurons: params.maxNumberNeurons,
      deterministic: params.deterministic,
      rngSeed: params.rngSeed,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    params.sizeX,
    params.sizeY,
    params.population,
    params.genomeInitialLength,
    params.genomeMaxLength,
    params.maxNumberNeurons,
    params.deterministic,
    params.rngSeed,
  ]);

  const structuralDirty = STRUCTURAL_KEYS.some((k) => pending[k] !== params[k]);

  const handleFetchTrueRandomSeed = async () => {
    setRngFetchStatus('loading');
    try {
      await onFetchTrueRandomSeed();
      setRngFetchStatus('idle');
    } catch {
      setRngFetchStatus('error');
    }
  };

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

      <SliderField
        label="Simulation speed"
        value={params.stepsPerFrame}
        min={1}
        max={20}
        step={1}
        formatValue={(v) => `${v} step${v > 1 ? 's' : ''}/frame`}
        onChange={(v) => onLiveChange({ stepsPerFrame: v })}
      />

      <label className="field">
        <span>Max generations (0 = unlimited)</span>
        <input
          type="number"
          min={0}
          value={params.maxGenerations}
          onChange={(e) => onLiveChange({ maxGenerations: Math.max(0, Number(e.target.value)) })}
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
        <label className="field checkbox">
          <input type="checkbox" checked={showSurvivorPreview} onChange={(e) => onToggleSurvivorPreview(e.target.checked)} />
          <span>Preview who'd survive right now</span>
        </label>
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
        <legend>Terrain</legend>
        <select value={params.terrainType} onChange={(e) => onLiveChange({ terrainType: Number(e.target.value) as TerrainType })}>
          {Object.entries(TERRAIN_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <p className="hint">
          Cold terrain (blue) slows movement, hot terrain (amber) speeds it up -- a stand-in for snow/mud/elevation. Never blocks outright the way
          barriers do. Creatures can sense their current terrain temperature.
        </p>
      </fieldset>

      <fieldset className="field-group">
        <legend>Genetics</legend>
        <SliderField
          label="Point mutation rate"
          value={params.pointMutationRate}
          min={0}
          max={0.05}
          step={0.0005}
          formatValue={(v) => `${(v * 100).toFixed(2)}%`}
          onChange={(v) => onLiveChange({ pointMutationRate: v })}
        />
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
        {params.killEnable && (
          <label className="field checkbox">
            <input
              type="checkbox"
              checked={params.killUsesTrueRng}
              onChange={(e) => onLiveChange({ killUsesTrueRng: e.target.checked })}
            />
            <span>Kill decisions use true RNG (drand/Cloudflare)</span>
          </label>
        )}
        {params.killEnable && params.killUsesTrueRng && (
          <p className="hint">
            Each kill roll draws from a stream reseeded from a real drand beacon fetch at the start of every generation (falls back to the
            previous seed if the fetch fails).
          </p>
        )}
      </fieldset>

      <fieldset className="field-group">
        <legend>Sensing</legend>
        <SliderField
          label="Population sensor radius"
          value={params.populationSensorRadius}
          min={0.5}
          max={10}
          step={0.5}
          formatValue={(v) => v.toFixed(1)}
          onChange={(v) => onLiveChange({ populationSensorRadius: v })}
        />
        <SliderField
          label="Pheromone sensor radius"
          value={params.signalSensorRadius}
          min={0.5}
          max={10}
          step={0.5}
          formatValue={(v) => v.toFixed(1)}
          onChange={(v) => onLiveChange({ signalSensorRadius: v })}
        />
        <label className="field checkbox">
          <input type="checkbox" checked={showPheromones} onChange={(e) => onTogglePheromones(e.target.checked)} />
          <span>Show pheromone overlay</span>
        </label>
      </fieldset>

      <fieldset className="field-group">
        <legend>Export</legend>
        <div className="button-row">
          <button onClick={onExportSnapshot}>PNG snapshot</button>
          <button onClick={onExportConfig}>Config (JSON)</button>
          <button onClick={onExportStats}>Stats (CSV)</button>
        </div>
        <div className="button-row">
          <button className={isRecording ? 'active' : ''} onClick={onToggleRecording}>
            {isRecording ? '⏹ Stop recording' : '⏺ Record video (WebM)'}
          </button>
        </div>
      </fieldset>

      <fieldset className="field-group">
        <legend>World &amp; population (requires restart)</legend>
        <SliderField label="World width" value={pending.sizeX} min={32} max={256} step={8} onChange={(v) => setPending((p) => ({ ...p, sizeX: v }))} />
        <SliderField label="World height" value={pending.sizeY} min={32} max={256} step={8} onChange={(v) => setPending((p) => ({ ...p, sizeY: v }))} />
        <SliderField
          label="Population"
          value={pending.population}
          min={50}
          max={6000}
          step={50}
          onChange={(v) => setPending((p) => ({ ...p, population: v }))}
        />
        <SliderField
          label="Initial genome length"
          value={pending.genomeInitialLength}
          min={4}
          max={128}
          step={1}
          onChange={(v) => setPending((p) => ({ ...p, genomeInitialLength: v }))}
        />
        <SliderField
          label="Max genome length"
          value={pending.genomeMaxLength}
          min={pending.genomeInitialLength}
          max={500}
          step={1}
          onChange={(v) => setPending((p) => ({ ...p, genomeMaxLength: v }))}
        />
        <SliderField
          label="Max internal neurons"
          value={pending.maxNumberNeurons}
          min={0}
          max={GPU_MAX_NEURONS}
          step={1}
          onChange={(v) => setPending((p) => ({ ...p, maxNumberNeurons: v }))}
        />
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
        <button className="secondary" disabled={rngFetchStatus === 'loading'} onClick={handleFetchTrueRandomSeed}>
          {rngFetchStatus === 'loading' ? 'Fetching…' : '🎲 True random seed (drand/Cloudflare)'}
        </button>
        {rngFetchStatus === 'error' && <p className="hint error">Couldn't reach the randomness beacon — check your connection and try again.</p>}
        <button className="primary" disabled={!structuralDirty} onClick={() => onApplyStructural(pending)}>
          Apply &amp; restart
        </button>
      </fieldset>
    </div>
  );
}
