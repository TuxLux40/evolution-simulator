import { useEffect, useState } from 'react';
import { type SimParams, type ComputeBackend, Challenge, BarrierType, TerrainType } from '../sim/params';
import { GPU_MAX_NEURONS } from '../sim/gpuFeedForward';
import { SliderField } from './SliderField';
import { InfoTooltip } from './InfoTooltip';
import { useI18n } from '../i18n/I18nContext';
import type { TopicKey } from '../content/topics';

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
  onOpenLearn: (topic: TopicKey) => void;
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

const CHALLENGE_VALUES = [
  Challenge.CIRCLE,
  Challenge.RIGHT_HALF,
  Challenge.RIGHT_QUARTER,
  Challenge.STRING,
  Challenge.CENTER_WEIGHTED,
  Challenge.CENTER_UNWEIGHTED,
  Challenge.CORNER,
  Challenge.CORNER_WEIGHTED,
  Challenge.MIGRATE_DISTANCE,
  Challenge.CENTER_SPARSE,
  Challenge.LEFT_EIGHTH,
  Challenge.RADIOACTIVE_WALLS,
  Challenge.AGAINST_ANY_WALL,
  Challenge.TOUCH_ANY_WALL,
  Challenge.EAST_WEST_EIGHTHS,
  Challenge.NEAR_BARRIER,
  Challenge.PAIRS,
  Challenge.LOCATION_SEQUENCE,
  Challenge.ALTRUISM,
];
const BARRIER_VALUES = [
  BarrierType.NONE,
  BarrierType.VERTICAL_BAR_CONSTANT,
  BarrierType.VERTICAL_BAR_RANDOM,
  BarrierType.FIVE_STAGGERED_BLOCKS,
  BarrierType.HORIZONTAL_BAR,
  BarrierType.FLOATING_ISLAND,
  BarrierType.SPOTS,
];
const TERRAIN_VALUES = [
  TerrainType.NONE,
  TerrainType.GRADIENT,
  TerrainType.COLD_PATCH_CENTER,
  TerrainType.HOT_PATCH_CENTER,
  TerrainType.ALTERNATING_BANDS,
  TerrainType.RANDOM_SPOTS,
];

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
    onOpenLearn,
  } = props;
  const { t } = useI18n();

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

  const speedLabel = params.stepsPerFrame > 1 ? t('controls.simSpeedPlural', { n: params.stepsPerFrame }) : t('controls.simSpeedSingular', { n: params.stepsPerFrame });

  return (
    <div className="panel control-panel">
      <h2>{t('controls.title')}</h2>

      <div className="button-row">
        <button onClick={onPlayPause}>{running ? t('controls.pause') : t('controls.play')}</button>
        <button onClick={onStep} disabled={running}>
          {t('controls.step')}
        </button>
        <button onClick={onResetRun} className="secondary">
          {t('controls.restartRun')}
        </button>
      </div>

      <SliderField label={t('controls.simSpeed')} value={params.stepsPerFrame} min={1} max={20} step={1} formatValue={() => speedLabel} onChange={(v) => onLiveChange({ stepsPerFrame: v })} />

      <label className="field">
        <span>{t('controls.maxGenerations')}</span>
        <input
          type="number"
          min={0}
          value={params.maxGenerations}
          onChange={(e) => onLiveChange({ maxGenerations: Math.max(0, Number(e.target.value)) })}
        />
      </label>

      <fieldset className="field-group">
        <legend>
          {t('controls.computeBackend')}
          <InfoTooltip topicKey="neuroevolution" onOpenLearn={onOpenLearn} />
        </legend>
        <div className="button-row">
          <button className={params.computeBackend === 'cpu' ? 'active' : ''} onClick={() => onBackendChange('cpu')}>
            {t('controls.cpu')}
          </button>
          <button
            className={params.computeBackend === 'gpu' ? 'active' : ''}
            onClick={() => onBackendChange('gpu')}
            disabled={gpuStatus !== 'available'}
            title={gpuStatus === 'unavailable' ? t('controls.gpuTitleUnavailable') : t('controls.gpuTitleAvailable')}
          >
            {t('controls.gpu')} {gpuStatus === 'checking' ? t('controls.gpuChecking') : gpuStatus === 'unavailable' ? t('controls.gpuUnavailable') : ''}
          </button>
        </div>
        <p className="hint">{t('controls.gpuHint')}</p>
      </fieldset>

      <fieldset className="field-group">
        <legend>
          {t('controls.selectionChallenge')}
          <InfoTooltip topicKey="selectionPressure" onOpenLearn={onOpenLearn} />
        </legend>
        <select value={params.challenge} onChange={(e) => onLiveChange({ challenge: Number(e.target.value) as Challenge })}>
          {CHALLENGE_VALUES.map((value) => (
            <option key={value} value={value}>
              {t(`challengeOption.${value}`)}
            </option>
          ))}
        </select>
        <p className="hint">{t('controls.challengeHint')}</p>
        <label className="field checkbox">
          <input type="checkbox" checked={showSurvivorPreview} onChange={(e) => onToggleSurvivorPreview(e.target.checked)} />
          <span>{t('controls.survivorPreview')}</span>
        </label>
        {params.challenge === Challenge.ALTRUISM && (
          <p className="hint">
            <InfoTooltip topicKey="kinSelection" onOpenLearn={onOpenLearn} /> {t('topic.kinSelection.tagline')}
          </p>
        )}
      </fieldset>

      <fieldset className="field-group">
        <legend>{t('controls.barriers')}</legend>
        <select value={params.barrierType} onChange={(e) => onLiveChange({ barrierType: Number(e.target.value) as BarrierType })}>
          {BARRIER_VALUES.map((value) => (
            <option key={value} value={value}>
              {t(`barrierOption.${value}`)}
            </option>
          ))}
        </select>
      </fieldset>

      <fieldset className="field-group">
        <legend>
          {t('controls.terrain')}
          <InfoTooltip topicKey="adaptation" onOpenLearn={onOpenLearn} />
        </legend>
        <select value={params.terrainType} onChange={(e) => onLiveChange({ terrainType: Number(e.target.value) as TerrainType })}>
          {TERRAIN_VALUES.map((value) => (
            <option key={value} value={value}>
              {t(`terrainOption.${value}`)}
            </option>
          ))}
        </select>
        <p className="hint">{t('controls.terrainHint')}</p>
      </fieldset>

      <fieldset className="field-group">
        <legend>
          {t('controls.genetics')}
          <InfoTooltip topicKey="mutation" onOpenLearn={onOpenLearn} />
        </legend>
        <SliderField
          label={t('controls.mutationRate')}
          value={params.pointMutationRate}
          min={0}
          max={0.05}
          step={0.0005}
          formatValue={(v) => `${(v * 100).toFixed(2)}%`}
          onChange={(v) => onLiveChange({ pointMutationRate: v })}
        />
        <label className="field checkbox">
          <input type="checkbox" checked={params.sexualReproduction} onChange={(e) => onLiveChange({ sexualReproduction: e.target.checked })} />
          <span>{t('controls.sexualReproduction')}</span>
          <InfoTooltip topicKey="reproduction" onOpenLearn={onOpenLearn} />
        </label>
        <label className="field checkbox">
          <input
            type="checkbox"
            checked={params.chooseParentsByFitness}
            onChange={(e) => onLiveChange({ chooseParentsByFitness: e.target.checked })}
          />
          <span>{t('controls.biasByFitness')}</span>
        </label>
        <label className="field checkbox">
          <input type="checkbox" checked={params.killEnable} onChange={(e) => onLiveChange({ killEnable: e.target.checked })} />
          <span>{t('controls.allowKilling')}</span>
        </label>
        {params.killEnable && (
          <label className="field checkbox">
            <input
              type="checkbox"
              checked={params.killUsesTrueRng}
              onChange={(e) => onLiveChange({ killUsesTrueRng: e.target.checked })}
            />
            <span>{t('controls.killTrueRng')}</span>
          </label>
        )}
        {params.killEnable && params.killUsesTrueRng && <p className="hint">{t('controls.killTrueRngHint')}</p>}
      </fieldset>

      <fieldset className="field-group">
        <legend>
          {t('controls.sensing')}
          <InfoTooltip topicKey="stigmergy" onOpenLearn={onOpenLearn} />
        </legend>
        <SliderField
          label={t('controls.popSensorRadius')}
          value={params.populationSensorRadius}
          min={0.5}
          max={10}
          step={0.5}
          formatValue={(v) => v.toFixed(1)}
          onChange={(v) => onLiveChange({ populationSensorRadius: v })}
        />
        <SliderField
          label={t('controls.pheromoneSensorRadius')}
          value={params.signalSensorRadius}
          min={0.5}
          max={10}
          step={0.5}
          formatValue={(v) => v.toFixed(1)}
          onChange={(v) => onLiveChange({ signalSensorRadius: v })}
        />
        <label className="field checkbox">
          <input type="checkbox" checked={showPheromones} onChange={(e) => onTogglePheromones(e.target.checked)} />
          <span>{t('controls.showPheromones')}</span>
        </label>
      </fieldset>

      <fieldset className="field-group">
        <legend>{t('controls.export')}</legend>
        <div className="button-row">
          <button onClick={onExportSnapshot}>{t('controls.pngSnapshot')}</button>
          <button onClick={onExportConfig}>{t('controls.configJson')}</button>
          <button onClick={onExportStats}>{t('controls.statsCsv')}</button>
        </div>
        <div className="button-row">
          <button className={isRecording ? 'active' : ''} onClick={onToggleRecording}>
            {isRecording ? t('controls.stopRecording') : t('controls.recordVideo')}
          </button>
        </div>
      </fieldset>

      <fieldset className="field-group">
        <legend>
          {t('controls.worldPopulation')}
          <InfoTooltip topicKey="geneticDrift" onOpenLearn={onOpenLearn} />
        </legend>
        <SliderField label={t('controls.worldWidth')} value={pending.sizeX} min={32} max={256} step={8} onChange={(v) => setPending((p) => ({ ...p, sizeX: v }))} />
        <SliderField label={t('controls.worldHeight')} value={pending.sizeY} min={32} max={256} step={8} onChange={(v) => setPending((p) => ({ ...p, sizeY: v }))} />
        <SliderField
          label={t('controls.population')}
          value={pending.population}
          min={50}
          max={6000}
          step={50}
          onChange={(v) => setPending((p) => ({ ...p, population: v }))}
        />
        <SliderField
          label={t('controls.initialGenomeLength')}
          value={pending.genomeInitialLength}
          min={4}
          max={128}
          step={1}
          onChange={(v) => setPending((p) => ({ ...p, genomeInitialLength: v }))}
        />
        <SliderField
          label={t('controls.maxGenomeLength')}
          value={pending.genomeMaxLength}
          min={pending.genomeInitialLength}
          max={500}
          step={1}
          onChange={(v) => setPending((p) => ({ ...p, genomeMaxLength: v }))}
        />
        <SliderField
          label={t('controls.maxNeurons')}
          value={pending.maxNumberNeurons}
          min={0}
          max={GPU_MAX_NEURONS}
          step={1}
          onChange={(v) => setPending((p) => ({ ...p, maxNumberNeurons: v }))}
        />
        <label className="field checkbox">
          <input type="checkbox" checked={pending.deterministic} onChange={(e) => setPending((p) => ({ ...p, deterministic: e.target.checked }))} />
          <span>{t('controls.deterministicRng')}</span>
        </label>
        {pending.deterministic && (
          <label className="field">
            <span>{t('controls.rngSeed')}</span>
            <input
              type="number"
              value={pending.rngSeed}
              onChange={(e) => setPending((p) => ({ ...p, rngSeed: Number(e.target.value) }))}
            />
          </label>
        )}
        <button className="secondary" disabled={rngFetchStatus === 'loading'} onClick={handleFetchTrueRandomSeed}>
          {rngFetchStatus === 'loading' ? t('controls.fetchingSeed') : t('controls.fetchTrueSeed')}
        </button>
        {rngFetchStatus === 'error' && <p className="hint error">{t('controls.fetchSeedError')}</p>}
        <button className="primary" disabled={!structuralDirty} onClick={() => onApplyStructural(pending)}>
          {t('controls.applyRestart')}
        </button>
      </fieldset>
    </div>
  );
}
