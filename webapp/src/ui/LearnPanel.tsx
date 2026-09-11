import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { TOPIC_ORDER, type TopicKey } from '../content/topics';

interface LearnPanelProps {
  initialTopic: TopicKey | null;
  onClose: () => void;
}

export function LearnPanel({ initialTopic, onClose }: LearnPanelProps) {
  const { t } = useI18n();
  // App.tsx only ever mounts this component fresh (it's conditionally
  // rendered, going through `undefined` between opens), so the initializer
  // below is always given the right starting topic -- no need to re-sync.
  const [activeTopic, setActiveTopic] = useState<TopicKey>(initialTopic ?? TOPIC_ORDER[0]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="learn-modal-backdrop" onClick={onClose}>
      <div className="learn-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={t('learn.title')}>
        <nav className="learn-modal-nav">
          {TOPIC_ORDER.map((topic) => (
            <button key={topic} className={topic === activeTopic ? 'active' : ''} onClick={() => setActiveTopic(topic)}>
              {t(`topic.${topic}.title`)}
            </button>
          ))}
        </nav>
        <div className="learn-modal-content">
          <h2>{t(`topic.${activeTopic}.title`)}</h2>
          <p className="tagline">{t(`topic.${activeTopic}.tagline`)}</p>
          <p>{t(`topic.${activeTopic}.body`)}</p>
          <div className="in-sim">
            <strong>{t('learn.inSimLabel')}:</strong> {t(`topic.${activeTopic}.inSim`)}
          </div>
        </div>
        <button className="learn-modal-close" onClick={onClose} aria-label={t('learn.close')}>
          ✕
        </button>
      </div>
    </div>
  );
}
