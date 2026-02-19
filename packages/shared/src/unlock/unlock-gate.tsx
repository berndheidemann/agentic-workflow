import React from 'react';
import { useUnlock } from './use-unlock';

interface UnlockGateProps {
  /** Course slug (e.g. "ap1", "pandas") */
  course: string;
  /** Module identifier to check */
  module: string;
  /** Content to render when unlocked */
  children: React.ReactNode;
  /** Optional custom fallback when locked. Defaults to a standard lock message. */
  fallback?: React.ReactNode;
}

/**
 * Wrapper component that gates content behind module unlock status.
 *
 * - Guest mode (not logged in): content is always shown (no gate).
 * - Unlocked: content is shown normally.
 * - Locked: shows a lock message or custom fallback.
 * - While loading: content is shown (optimistic open).
 */
export function UnlockGate({ course, module, children, fallback }: UnlockGateProps) {
  const { isModuleUnlocked } = useUnlock();
  const unlocked = isModuleUnlocked(course, module);

  if (unlocked) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div
      role="alert"
      className="unlock-gate-locked"
      style={{
        padding: '2rem',
        textAlign: 'center',
        border: '1px solid #e5e7eb',
        borderRadius: '0.75rem',
        backgroundColor: '#f9fafb',
      }}
    >
      <div aria-hidden="true" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
        🔒
      </div>
      <p style={{ color: '#374151', fontWeight: 500 }}>
        Dieses Modul wurde noch nicht freigeschaltet.
      </p>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
        Dein Lehrer muss dieses Modul zuerst freischalten.
      </p>
    </div>
  );
}
