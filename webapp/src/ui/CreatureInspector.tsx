import { useEffect, useRef, useState } from 'react';
import type { SimulationEngine, IndividualDetail } from '../sim/engine';
import { BrainDiagram } from '../render/BrainDiagram';
import { colorFromHash } from '../render/colorFromGenome';
import { exportSvgElement } from '../export/exporters';
import { useI18n } from '../i18n/I18nContext';
import { InfoTooltip } from './InfoTooltip';
import type { TopicKey } from '../content/topics';

interface CreatureInspectorProps {
  engine: SimulationEngine;
  uid: number;
  isFollowing: boolean;
  onToggleFollow: () => void;
  onClose: () => void;
  onSelectUid: (uid: number) => void;
  onOpenLearn: (topic: TopicKey) => void;
}

export function CreatureInspector({ engine, uid, isFollowing, onToggleFollow, onClose, onSelectUid, onOpenLearn }: CreatureInspectorProps) {
  const { t } = useI18n();
  const [detail, setDetail] = useState<IndividualDetail | null>(() => engine.getIndividualDetail(uid));
  const brainContainerRef = useRef<HTMLDivElement | null>(null);
  const [editingNeuron, setEditingNeuron] = useState<number | null>(null);
  const [pendingValue, setPendingValue] = useState(0);

  const isCpuBackend = engine.params.computeBackend === 'cpu';

  const handleExportBrainSvg = () => {
    const svg = brainContainerRef.current?.querySelector('svg');
    if (svg) exportSvgElement(svg, `evolution-sim-brain-${uid}`);
  };

  const handleNeuronClick = (index: number) => {
    if (!isCpuBackend) return;
    setEditingNeuron((current) => (current === index ? null : index));
    setPendingValue(detail?.neurons[index]?.output ?? 0);
  };

  const handleTogglePin = (checked: boolean) => {
    if (editingNeuron === null) return;
    engine.setNeuronOverride(uid, editingNeuron, checked, checked ? pendingValue : undefined);
    setDetail(engine.getIndividualDetail(uid));
  };

  const handleSlideValue = (value: number) => {
    setPendingValue(value);
    if (editingNeuron === null) return;
    if (detail?.neurons[editingNeuron]?.pinned) {
      engine.setNeuronOverride(uid, editingNeuron, true, value);
      setDetail(engine.getIndividualDetail(uid));
    }
  };

  // Parent mounts one instance per uid (key={uid}), so the useState
  // initializer above already covers the first paint -- this effect only
  // needs to keep polling for updates as the creature lives its life.
  useEffect(() => {
    const interval = setInterval(() => {
      setDetail(engine.getIndividualDetail(uid));
    }, 200);
    return () => clearInterval(interval);
  }, [engine, uid]);

  if (!detail) {
    return (
      <div className="panel inspector-panel">
        <div className="inspector-header">
          <h2>{t('inspector.creature', { uid })}</h2>
          <button onClick={onClose}>✕</button>
        </div>
        <p className="hint">{t('inspector.noLongerTracked')}</p>
      </div>
    );
  }

  const lineage = engine.getLineage(uid, 6);

  return (
    <div className="panel inspector-panel">
      <div className="inspector-header">
        <h2 style={{ color: colorFromHash(detail.colorHash) }}>{t('inspector.creature', { uid: detail.uid })}</h2>
        <button onClick={onClose}>✕</button>
      </div>

      <div className="button-row">
        <button className={isFollowing ? 'active' : ''} onClick={onToggleFollow} disabled={!detail.alive}>
          {isFollowing ? t('inspector.following') : t('inspector.follow')}
        </button>
      </div>

      <div className="stat-row">
        <span>{t('inspector.status')}</span>
        <strong>{detail.alive ? t('inspector.alive') : t('inspector.dead')}</strong>
      </div>
      <div className="stat-row">
        <span>{t('inspector.generation')}</span>
        <strong>{detail.generation}</strong>
      </div>
      <div className="stat-row">
        <span>{t('inspector.age')}</span>
        <strong>{t('inspector.ageSteps', { n: detail.age })}</strong>
      </div>
      <div className="stat-row">
        <span>{t('inspector.location')}</span>
        <strong>
          ({detail.loc.x}, {detail.loc.y})
        </strong>
      </div>
      <div className="stat-row">
        <span>{t('inspector.birthLocation')}</span>
        <strong>
          ({detail.birthLoc.x}, {detail.birthLoc.y})
        </strong>
      </div>
      <div className="stat-row">
        <span>{t('inspector.migrationDistance')}</span>
        <strong>{detail.migrationDistance}</strong>
      </div>
      <div className="stat-row">
        <span>{t('inspector.genomeLength')}</span>
        <strong>{t('inspector.genomeLengthGenes', { n: detail.genomeLength })}</strong>
      </div>
      <div className="stat-row">
        <span>{t('inspector.neuronsConnections')}</span>
        <strong>
          {detail.neurons.length} / {detail.connections.length}
        </strong>
      </div>
      <div className="stat-row">
        <span>{t('inspector.responsiveness')}</span>
        <strong>{detail.responsiveness.toFixed(2)}</strong>
      </div>

      <h3>
        {t('inspector.lineage')}
        <InfoTooltip topicKey="genotypePhenotype" onOpenLearn={onOpenLearn} />
      </h3>
      {lineage.length <= 1 ? (
        <p className="hint">{detail.generation === 0 ? t('inspector.originalGeneration') : t('inspector.parentsGone')}</p>
      ) : (
        <ul className="lineage-list">
          {lineage.slice(1).map((ancestor) => (
            <li key={ancestor.uid}>
              <span className="lineage-swatch" style={{ background: colorFromHash(ancestor.colorHash) }} />
              {t('inspector.genLabel', { gen: ancestor.generation, uid: ancestor.uid })}{' '}
              <button className="link-button" onClick={() => onSelectUid(ancestor.uid)}>
                {t('inspector.view')}
              </button>
            </li>
          ))}
        </ul>
      )}
      {detail.parentUids && (
        <p className="hint">
          {t('inspector.directParents', { p1: detail.parentUids[0] })}
          {detail.parentUids[1] !== detail.parentUids[0]
            ? t('inspector.directParentsSecond', { p2: detail.parentUids[1] })
            : t('inspector.asexual')}
        </p>
      )}

      <div className="inspector-header">
        <h3 style={{ margin: 0 }}>
          {t('inspector.brain')}
          <InfoTooltip topicKey="neuroevolution" onOpenLearn={onOpenLearn} />
        </h3>
        <button className="link-button" onClick={handleExportBrainSvg}>
          {t('inspector.exportSvg')}
        </button>
      </div>
      <p className="hint">{isCpuBackend ? t('inspector.neuronEditHintCpu') : t('inspector.neuronEditHintGpu')}</p>
      <div ref={brainContainerRef}>
        <BrainDiagram
          connections={detail.connections}
          neurons={detail.neurons}
          editable={isCpuBackend}
          selectedNeuronIndex={editingNeuron}
          onNeuronClick={handleNeuronClick}
        />
      </div>

      {editingNeuron !== null && detail.neurons[editingNeuron] && (
        <div className="field-group">
          <div className="stat-row">
            <span>{t('inspector.neuronLabel', { n: editingNeuron })}</span>
            <strong>
              {detail.neurons[editingNeuron].pinned ? t('inspector.pinned') : detail.neurons[editingNeuron].driven ? t('inspector.driven') : t('inspector.undriven')}
            </strong>
          </div>
          <label className="field checkbox">
            <input type="checkbox" checked={detail.neurons[editingNeuron].pinned} onChange={(e) => handleTogglePin(e.target.checked)} />
            <span>{t('inspector.pinThisNeuron')}</span>
          </label>
          <label className="field">
            <span>
              {t('inspector.fixedOutputValue')} ({pendingValue.toFixed(2)})
            </span>
            <div className="slider-row">
              <input type="range" min={-1} max={1} step={0.01} value={pendingValue} onChange={(e) => handleSlideValue(Number(e.target.value))} />
              <input
                type="number"
                className="slider-number"
                min={-1}
                max={1}
                step={0.01}
                value={pendingValue}
                onChange={(e) => handleSlideValue(Number(e.target.value))}
              />
            </div>
          </label>
        </div>
      )}
    </div>
  );
}
