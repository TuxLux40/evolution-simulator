import { HistoryChart } from './HistoryChart';
import { InfoTooltip } from './InfoTooltip';
import { useI18n } from '../i18n/I18nContext';
import type { WorldStats } from '../render/WorldCanvas';
import type { TopicKey } from '../content/topics';

export function StatsPanel({ stats, onOpenLearn }: { stats: WorldStats | null; onOpenLearn: (topic: TopicKey) => void }) {
  const { t } = useI18n();
  if (!stats) return null;
  const genProgress = stats.stepsPerGeneration > 0 ? stats.simStep / stats.stepsPerGeneration : 0;

  return (
    <div className="panel stats-panel">
      <h2>
        {t('stats.title')}
        <InfoTooltip topicKey="naturalSelection" onOpenLearn={onOpenLearn} />
      </h2>
      <div className="stat-row">
        <span>{t('stats.generation')}</span>
        <strong>{stats.generation}</strong>
      </div>
      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${Math.min(100, genProgress * 100)}%` }} />
      </div>
      <div className="stat-row">
        <span>{t('stats.step')}</span>
        <strong>
          {stats.simStep} / {stats.stepsPerGeneration}
        </strong>
      </div>
      <div className="stat-row">
        <span>{t('stats.alive')}</span>
        <strong>
          {stats.aliveCount} / {stats.population}
        </strong>
      </div>
      <div className="stat-row">
        <span>{t('stats.lastGenSurvivors')}</span>
        <strong>{stats.lastSurvivorCount}</strong>
      </div>
      <h3>
        {t('stats.survivorsPerGeneration')}
        <InfoTooltip topicKey="bottleneck" onOpenLearn={onOpenLearn} />
      </h3>
      <HistoryChart values={stats.survivorHistory} max={stats.population} />
    </div>
  );
}
