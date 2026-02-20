import { useEffect, useRef, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ArchiveClassDialogProps {
  className: string;
  schoolYear: string;
  studentCount: number;
  isOpen: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

// ─── Inner form (remounts on each open via key) ───────────────────────────────

interface DialogFormProps {
  className: string;
  schoolYear: string;
  studentCount: number;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  dialogRef: React.RefObject<HTMLDialogElement | null>;
}

function DialogForm({ className, schoolYear, studentCount, onConfirm, onCancel, dialogRef }: DialogFormProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle native Escape key (cancel event)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    function handleCancel(e: Event) {
      e.preventDefault();
      if (!isSubmitting) onCancel();
    }
    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [dialogRef, onCancel, isSubmitting]);

  // Focus cancel button when form mounts (dialog just opened)
  useEffect(() => {
    setTimeout(() => cancelButtonRef.current?.focus(), 50);
  }, []);

  async function handleConfirm() {
    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Archivierung fehlgeschlagen.';
      setError(message);
      setIsSubmitting(false);
    }
  }

  const studentLabel = studentCount === 1 ? '1 Schüler' : `${studentCount} Schülern`;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div
          className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"
          aria-hidden="true"
        >
          <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <div>
          <h2 id="archive-dialog-title" className="text-lg font-semibold text-gray-900">
            Klasse archivieren
          </h2>
          <p id="archive-dialog-desc" className="text-sm text-gray-600 mt-1">
            Klasse <strong>{className}</strong> ({schoolYear}) mit{' '}
            <strong>{studentLabel}</strong> wirklich archivieren?
          </p>
        </div>
      </div>

      {/* Warning box */}
      <div
        className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg"
        role="note"
        aria-label="Wichtiger Hinweis zur Archivierung"
      >
        <p className="text-sm font-medium text-red-800 mb-2">Diese Aktion ist irreversibel:</p>
        <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
          <li>Alle Schüler-Accounts der Klasse werden gelöscht</li>
          <li>Alle Lernfortschritte der Schüler werden gelöscht</li>
          <li>Alle Modul-Freischaltungen werden gelöscht</li>
          <li>Die Klasse ({className}) bleibt als Referenz erhalten</li>
        </ul>
      </div>

      {/* Error */}
      {error && (
        <div role="alert" aria-live="assertive" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          ref={cancelButtonRef}
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Abbrechen
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Wird archiviert…' : 'Unwiderruflich archivieren'}
        </button>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ArchiveClassDialog({
  className,
  schoolYear,
  studentCount,
  isOpen,
  onConfirm,
  onCancel,
}: ArchiveClassDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Open/close native dialog
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="archive-dialog-title"
      aria-describedby="archive-dialog-desc"
      className="rounded-xl shadow-2xl p-0 max-w-md w-full backdrop:bg-black/50"
      style={{ border: 'none' }}
    >
      {/* key resets inner state on each open */}
      <DialogForm
        key={String(isOpen)}
        className={className}
        schoolYear={schoolYear}
        studentCount={studentCount}
        onConfirm={onConfirm}
        onCancel={onCancel}
        dialogRef={dialogRef}
      />
    </dialog>
  );
}
