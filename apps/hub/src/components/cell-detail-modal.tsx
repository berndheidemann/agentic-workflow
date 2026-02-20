import { useEffect, useRef } from 'react';
import type { MatrixCell, MatrixColumn } from '../hooks/use-class-progress';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CellDetailModalProps {
  cell: MatrixCell | null;
  column: MatrixColumn | null;
  studentName: string;
  isOpen: boolean;
  onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusLabel(status: MatrixCell['status']): string {
  switch (status) {
    case 'correct':
      return 'Bestanden';
    case 'incorrect':
      return 'Nicht bestanden';
    case 'unattempted':
      return 'Nicht angefangen';
  }
}

function statusClass(status: MatrixCell['status']): string {
  switch (status) {
    case 'correct':
      return 'bg-green-100 text-green-800';
    case 'incorrect':
      return 'bg-orange-100 text-orange-800';
    case 'unattempted':
      return 'bg-gray-100 text-gray-600';
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Modal dialog showing detail info for a single matrix cell:
 * attempts, score, and completion timestamp.
 */
export function CellDetailModal({
  cell,
  column,
  studentName,
  isOpen,
  onClose,
}: CellDetailModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Sync <dialog> open/close and manage focus
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      if (!dialog.open) dialog.showModal();
      setTimeout(() => closeButtonRef.current?.focus(), 50);
    } else {
      if (dialog.open) dialog.close();
    }
  }, [isOpen]);

  // Close on native dialog cancel (Escape key)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    function handleCancel(e: Event) {
      e.preventDefault();
      onClose();
    }
    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [onClose]);

  if (!isOpen || !cell || !column) return null;

  const progress = cell.progress;
  const attempts = progress?.attempts ?? 0;
  const score = progress?.score ?? 0;
  const maxScore = progress?.max_score ?? 0;
  const completedAt = formatDate(progress?.completed_at);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="cell-detail-title"
      aria-describedby="cell-detail-desc"
      className="rounded-xl shadow-2xl p-0 max-w-sm w-full backdrop:bg-black/40"
      style={{ border: 'none' }}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2
              id="cell-detail-title"
              className="text-lg font-semibold text-gray-900"
            >
              Aufgaben-Detail
            </h2>
            <p id="cell-detail-desc" className="text-sm text-gray-500 mt-0.5">
              {studentName} · {column.label}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Detail schließen"
            className="ml-4 p-1 text-gray-400 hover:text-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <svg
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Status badge */}
        <div className="mb-4 flex flex-wrap gap-2 items-center">
          <span
            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusClass(cell.status)}`}
          >
            {statusLabel(cell.status)}
          </span>
          {cell.suspicious && (
            <span
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800"
              aria-label="Verdächtige Aktivität"
            >
              <span aria-hidden="true">⚠</span>
              Verdächtig
            </span>
          )}
        </div>

        {/* Suspicious hint */}
        {cell.suspicious && (
          <div
            role="note"
            className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800"
          >
            <strong>Hinweis:</strong> Diese Aufgabe wurde als verdächtig markiert, weil sie
            ungewöhnlich schnell gelöst wurde (mehr als 5 Aufgaben pro Minute). Kein automatischer
            Block — nur zur Information.
          </div>
        )}

        {/* Detail rows */}
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-600">Versuche</dt>
            <dd className="font-semibold text-gray-900" aria-label={`${attempts} Versuche`}>
              {attempts}
            </dd>
          </div>

          <div className="flex justify-between">
            <dt className="text-gray-600">Punkte</dt>
            <dd
              className="font-semibold text-gray-900"
              aria-label={`${score} von ${maxScore} Punkten`}
            >
              {maxScore > 0 ? `${score} / ${maxScore}` : '—'}
            </dd>
          </div>

          <div className="flex justify-between">
            <dt className="text-gray-600">Abgeschlossen</dt>
            <dd className="font-semibold text-gray-900">{completedAt}</dd>
          </div>
        </dl>

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Schließen
        </button>
      </div>
    </dialog>
  );
}
