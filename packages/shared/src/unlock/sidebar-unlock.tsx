import React, { useState } from 'react';
import type { ModuleStatus } from './types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface SidebarUnlockProps {
  /** Current unlock/completion status of the module */
  status: ModuleStatus;
  /** Human-readable module name for accessibility labels */
  label: string;
  /** Called when user clicks a locked item. If not provided, an inline hint is shown. */
  onLockedClick?: () => void;
  /** Optional className for the icon wrapper */
  className?: string;
}

// ─── Icon SVGs ────────────────────────────────────────────────────────────────

function LockIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ─── SidebarUnlock ─────────────────────────────────────────────────────────────

/**
 * Status indicator for a module in the sidebar.
 *
 * - locked: shows a lock icon + click handler (shows hint when clicked)
 * - unlocked: renders nothing (default, unobtrusive)
 * - completed: shows a green checkmark icon
 *
 * The caller is responsible for determining the status —
 * this component is intentionally "dumb" (prop-based, no hook calls).
 */
export function SidebarUnlock({ status, label, onLockedClick, className }: SidebarUnlockProps) {
  const [showHint, setShowHint] = useState(false);
  const hintId = `sidebar-unlock-hint-${label.replace(/\s+/g, '-').toLowerCase()}`;

  if (status === 'unlocked') {
    return null;
  }

  if (status === 'completed') {
    return (
      <span
        className={`sidebar-unlock-completed${className ? ` ${className}` : ''}`}
        aria-label={`${label} abgeschlossen`}
        title={`${label} abgeschlossen`}
        role="img"
        style={{ color: 'var(--color-success, #16a34a)' }}
      >
        <CheckIcon />
      </span>
    );
  }

  // status === 'locked'
  const handleClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onLockedClick) {
      onLockedClick();
    } else {
      setShowHint((prev) => !prev);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick(e);
    }
  };

  return (
    <>
      <span
        className={`sidebar-unlock-locked${className ? ` ${className}` : ''}`}
        aria-label={`${label} ist gesperrt`}
        title={`${label} ist gesperrt`}
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-describedby={!onLockedClick && showHint ? hintId : undefined}
        style={{ cursor: 'pointer' }}
      >
        <LockIcon />
      </span>
      {!onLockedClick && showHint && (
        <span
          id={hintId}
          role="tooltip"
          className="sidebar-unlock-hint"
          style={{
            display: 'block',
            fontSize: '0.75rem',
            color: 'var(--sl-color-gray-3, #6b7280)',
            marginTop: '0.25rem',
          }}
        >
          Dieses Modul wurde noch nicht freigeschaltet.
        </span>
      )}
    </>
  );
}
