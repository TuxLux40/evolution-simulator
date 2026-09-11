import { useEffect, useRef, useState } from 'react';
import type { SimulationEngine, IndividualDetail } from '../sim/engine';
import { BrainDiagram } from '../render/BrainDiagram';
import { colorFromHash } from '../render/colorFromGenome';
import { exportSvgElement } from '../export/exporters';

interface CreatureInspectorProps {
  engine: SimulationEngine;
  uid: number;
  isFollowing: boolean;
  onToggleFollow: () => void;
  onClose: () => void;
  onSelectUid: (uid: number) => void;
}

export function CreatureInspector({ engine, uid, isFollowing, onToggleFollow, onClose, onSelectUid }: CreatureInspectorProps) {
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
          <h2>Creature #{uid}</h2>
          <button onClick={onClose}>✕</button>
        </div>
        <p className="hint">No longer tracked (its generation has ended).</p>
      </div>
    );
  }

  const lineage = engine.getLineage(uid, 6);

  return (
    <div className="panel inspector-panel">
      <div className="inspector-header">
        <h2 style={{ color: colorFromHash(detail.colorHash) }}>Creature #{detail.uid}</h2>
        <button onClick={onClose}>✕</button>
      </div>

      <div className="button-row">
        <button className={isFollowing ? 'active' : ''} onClick={onToggleFollow} disabled={!detail.alive}>
          {isFollowing ? '📍 Following' : '📍 Follow'}
        </button>
      </div>

      <div className="stat-row">
        <span>Status</span>
        <strong>{detail.alive ? 'Alive' : 'Dead'}</strong>
      </div>
      <div className="stat-row">
        <span>Generation</span>
        <strong>{detail.generation}</strong>
      </div>
      <div className="stat-row">
        <span>Age</span>
        <strong>{detail.age} steps</strong>
      </div>
      <div className="stat-row">
        <span>Location</span>
        <strong>
          ({detail.loc.x}, {detail.loc.y})
        </strong>
      </div>
      <div className="stat-row">
        <span>Birth location</span>
        <strong>
          ({detail.birthLoc.x}, {detail.birthLoc.y})
        </strong>
      </div>
      <div className="stat-row">
        <span>Migration distance</span>
        <strong>{detail.migrationDistance}</strong>
      </div>
      <div className="stat-row">
        <span>Genome length</span>
        <strong>{detail.genomeLength} genes</strong>
      </div>
      <div className="stat-row">
        <span>Neurons / connections</span>
        <strong>
          {detail.neurons.length} / {detail.connections.length}
        </strong>
      </div>
      <div className="stat-row">
        <span>Responsiveness</span>
        <strong>{detail.responsiveness.toFixed(2)}</strong>
      </div>

      <h3>Lineage</h3>
      {lineage.length <= 1 ? (
        <p className="hint">{detail.generation === 0 ? 'Original generation -- no parents.' : 'Parents no longer in the lineage log.'}</p>
      ) : (
        <ul className="lineage-list">
          {lineage.slice(1).map((ancestor) => (
            <li key={ancestor.uid}>
              <span className="lineage-swatch" style={{ background: colorFromHash(ancestor.colorHash) }} />
              gen {ancestor.generation} · #{ancestor.uid}{' '}
              <button className="link-button" onClick={() => onSelectUid(ancestor.uid)}>
                view
              </button>
            </li>
          ))}
        </ul>
      )}
      {detail.parentUids && (
        <p className="hint">
          Direct parents: #{detail.parentUids[0]}
          {detail.parentUids[1] !== detail.parentUids[0] ? `, #${detail.parentUids[1]}` : ' (asexual)'}
        </p>
      )}

      <div className="inspector-header">
        <h3 style={{ margin: 0 }}>Brain</h3>
        <button className="link-button" onClick={handleExportBrainSvg}>
          export SVG
        </button>
      </div>
      {isCpuBackend ? (
        <p className="hint">Click a neuron to pin it at a fixed value -- it'll stop reacting to its inputs for the rest of this creature's life.</p>
      ) : (
        <p className="hint">Neuron editing requires the CPU backend (the GPU compute shader has no notion of a pinned neuron).</p>
      )}
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
            <span>Neuron #{editingNeuron}</span>
            <strong>{detail.neurons[editingNeuron].pinned ? 'Pinned' : detail.neurons[editingNeuron].driven ? 'Driven' : 'Undriven (bias)'}</strong>
          </div>
          <label className="field checkbox">
            <input type="checkbox" checked={detail.neurons[editingNeuron].pinned} onChange={(e) => handleTogglePin(e.target.checked)} />
            <span>Pin this neuron</span>
          </label>
          <label className="field">
            <span>Fixed output value ({pendingValue.toFixed(2)})</span>
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
