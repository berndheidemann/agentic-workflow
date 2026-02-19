import type { PrerequisiteInfo } from './types';

interface PrerequisiteBannerProps {
  /** Unmet prerequisites to display. If empty, renders nothing. */
  unmet: PrerequisiteInfo[];
  /** Optional additional CSS class names. */
  className?: string;
}

/**
 * Yellow info banner shown at the top of a page when prerequisites are not met.
 *
 * Soft-gate: the page content remains fully visible. This is only a recommendation.
 *
 * Accessibility:
 * - role="note" — informational, not a blocking alert
 * - aria-label for screen readers
 * - All links are keyboard-navigable
 */
export function PrerequisiteBanner({ unmet, className }: PrerequisiteBannerProps) {
  if (unmet.length === 0) return null;

  const baseClass = [
    'prerequisite-banner',
    'sl-prereq-banner',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <aside
      role="note"
      aria-label="Empfohlene Voraussetzungen"
      className={baseClass}
      style={{
        backgroundColor: '#fef9c3',
        border: '1px solid #eab308',
        borderRadius: '6px',
        padding: '12px 16px',
        marginBottom: '24px',
        fontSize: '0.9rem',
        lineHeight: '1.5',
        color: '#713f12',
      }}
    >
      <span aria-hidden="true" style={{ marginRight: '6px' }}>⚠️</span>
      <strong>Wir empfehlen zuerst:</strong>{' '}
      {unmet.map((prereq, index) => (
        <span key={prereq.lessonPath}>
          {index > 0 && ', '}
          <a
            href={prereq.href}
            style={{
              color: '#92400e',
              textDecoration: 'underline',
              fontWeight: 500,
            }}
          >
            {prereq.displayName}
          </a>
        </span>
      ))}
    </aside>
  );
}
