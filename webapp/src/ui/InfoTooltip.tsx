import { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import type { TopicKey } from '../content/topics';

interface InfoTooltipProps {
  /** Topic key matching translation keys `topic.<topicKey>.title` / `.tagline`. */
  topicKey: TopicKey;
  onOpenLearn: (topicKey: TopicKey) => void;
}

/** A small "?" icon that shows a one-line teaser on hover/focus and opens the full Learn panel on click. */
export function InfoTooltip({ topicKey, onOpenLearn }: InfoTooltipProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <span className="info-tooltip" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        className="info-tooltip-trigger"
        aria-label={t(`topic.${topicKey}.title`)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => onOpenLearn(topicKey)}
      >
        ?
      </button>
      {open && (
        <div className="info-tooltip-popover" role="tooltip">
          <strong>{t(`topic.${topicKey}.title`)}</strong>
          <br />
          {t(`topic.${topicKey}.tagline`)}
        </div>
      )}
    </span>
  );
}
