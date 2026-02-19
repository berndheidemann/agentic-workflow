import { useState, useEffect, useRef } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ResetPinDialogProps {
  studentName: string;
  isOpen: boolean;
  onConfirm: (newPin: string) => Promise<void>;
  onCancel: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generatePin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function isValidPin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Dialog for resetting a student's PIN.
 * Generates a random 4-digit PIN or lets the teacher enter one manually.
 * Calls onConfirm(newPin) when the teacher confirms.
 */
export function ResetPinDialog({ studentName, isOpen, onConfirm, onCancel }: ResetPinDialogProps) {
  const [pin, setPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successPin, setSuccessPin] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate a new PIN when dialog opens
  useEffect(() => {
    if (isOpen) {
      setPin(generatePin());
      setError(null);
      setSuccessPin(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Sync <dialog> open/close and manage focus
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      if (!dialog.open) dialog.showModal();
      // Focus input after brief delay so dialog is rendered
      setTimeout(() => inputRef.current?.focus(), 50);
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
      onCancel();
    }
    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [onCancel]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidPin(pin)) {
      setError('Die PIN muss genau 4 Ziffern enthalten.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm(pin);
      setSuccessPin(pin);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
      setError(`PIN konnte nicht zurückgesetzt werden: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handlePinChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(value);
    setError(null);
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="reset-pin-dialog-title"
      aria-describedby="reset-pin-dialog-desc"
      className="rounded-xl shadow-2xl p-0 max-w-sm w-full backdrop:bg-black/40"
      style={{ border: 'none' }}
    >
      <div className="p-6">
        {successPin ? (
          // Success state
          <div>
            <h2 id="reset-pin-dialog-title" className="text-lg font-semibold text-gray-900 mb-2">
              PIN zurückgesetzt
            </h2>
            <p id="reset-pin-dialog-desc" className="text-sm text-gray-600 mb-4">
              Die neue PIN für <strong>{studentName}</strong> lautet:
            </p>
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
              <span
                className="font-mono text-3xl font-bold text-green-800 tracking-[0.5em]"
                aria-label={`Neue PIN: ${successPin}`}
              >
                {successPin}
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Teile diese PIN dem Schüler mit. Nach dem Schließen kann sie nicht mehr angezeigt werden.
            </p>
            <button
              type="button"
              onClick={onCancel}
              className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Schließen
            </button>
          </div>
        ) : (
          // Form state
          <form onSubmit={handleSubmit} noValidate>
            <h2 id="reset-pin-dialog-title" className="text-lg font-semibold text-gray-900 mb-1">
              PIN zurücksetzen
            </h2>
            <p id="reset-pin-dialog-desc" className="text-sm text-gray-600 mb-4">
              Neue PIN für <strong>{studentName}</strong> festlegen.
            </p>

            <div className="mb-4">
              <label htmlFor="reset-pin-input" className="block text-sm font-medium text-gray-700 mb-1">
                Neue PIN (4 Ziffern)
              </label>
              <input
                ref={inputRef}
                id="reset-pin-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{4}"
                maxLength={4}
                value={pin}
                onChange={handlePinChange}
                aria-required="true"
                aria-invalid={error !== null}
                aria-describedby={error ? 'reset-pin-error' : undefined}
                disabled={isSubmitting}
                className={[
                  'w-full px-3 py-2 border rounded-lg font-mono text-lg tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors',
                  error ? 'border-red-400 bg-red-50' : 'border-gray-300',
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : '',
                ].join(' ')}
                placeholder="0000"
              />
              {error && (
                <p id="reset-pin-error" role="alert" className="mt-1 text-xs text-red-600">
                  {error}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors disabled:opacity-50"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !isValidPin(pin)}
                aria-busy={isSubmitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Wird gespeichert…' : 'PIN setzen'}
              </button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
}
