import { HistoryChart } from './HistoryChart';
import type { WorldStats } from '../render/WorldCanvas';

export function StatsPanel({ stats }: { stats: WorldStats | null }) {
  if (!stats) return null;
  const genProgress = stats.stepsPerGeneration > 0 ? stats.simStep / stats.stepsPerGeneration : 0;

  return (
    <div className="panel stats-panel">
      <h2>Stats</h2>
      <div className="stat-row">
        <span>Generation</span>
        <strong>{stats.generation}</strong>
      </div>
      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${Math.min(100, genProgress * 100)}%` }} />
      </div>
      <div className="stat-row">
        <span>Step</span>
        <strong>
          {stats.simStep} / {stats.stepsPerGeneration}
        </strong>
      </div>
      <div className="stat-row">
        <span>Alive</span>
        <strong>
          {stats.aliveCount} / {stats.population}
        </strong>
      </div>
      <div className="stat-row">
        <span>Last gen survivors</span>
        <strong>{stats.lastSurvivorCount}</strong>
      </div>
      <h3>Survivors per generation</h3>
      <HistoryChart values={stats.survivorHistory} max={stats.population} />
    </div>
  );
}
