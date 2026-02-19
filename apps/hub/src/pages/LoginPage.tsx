import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@lernplattform/shared';
import { isValidPin } from '@lernplattform/shared';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  username: string;
  pin: string;
}

interface FormErrors {
  username?: string;
  pin?: string;
  general?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validateForm(state: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!state.username.trim()) {
    errors.username = 'Bitte Benutzernamen eingeben.';
  }

  if (!state.pin) {
    errors.pin = 'Bitte PIN eingeben.';
  } else if (!isValidPin(state.pin)) {
    errors.pin = 'PIN muss aus genau 4 Ziffern bestehen.';
  }

  return errors;
}

function mapLoginError(error: unknown): string {
  // PocketBase ClientResponseError has a status property
  const pbError = error as { status?: number };
  if (pbError?.status === 400) {
    return 'Benutzername oder PIN ist falsch.';
  }
  if (pbError?.status === 0) {
    return 'Verbindung zum Server fehlgeschlagen. Bitte versuche es erneut.';
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('failed to authenticate')) {
      return 'Benutzername oder PIN ist falsch.';
    }
    if (msg.includes('network') || msg.includes('failed to fetch')) {
      return 'Verbindung zum Server fehlgeschlagen. Bitte versuche es erneut.';
    }
  }
  return 'Ein unerwarteter Fehler ist aufgetreten.';
}

// ─── Component ────────────────────────────────────────────────────────────────

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({ username: '', pin: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(field: keyof FormState) {
    return (e: React.ChangeEvent<{ value: string }>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await login(form.username.trim(), form.pin);
      navigate('/');
    } catch (err) {
      setErrors({ general: mapLoginError(err) });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Anmelden</h1>
        <p className="text-gray-500 text-sm mb-6">Melde dich mit deinem Benutzernamen und PIN an.</p>

        {errors.general && (
          <div
            role="alert"
            aria-live="assertive"
            className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
          >
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Benutzername */}
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Benutzername
            </label>
            <input
              id="username"
              type="text"
              value={form.username}
              onChange={handleChange('username')}
              autoComplete="username"
              aria-invalid={errors.username ? 'true' : undefined}
              aria-describedby={errors.username ? 'username-error' : undefined}
              aria-required="true"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors ${
                errors.username
                  ? 'border-red-400 bg-red-50'
                  : 'border-gray-300 bg-white hover:border-gray-400'
              }`}
              placeholder="Dein Benutzername"
            />
            {errors.username && (
              <p id="username-error" className="mt-1 text-xs text-red-600" role="alert">
                {errors.username}
              </p>
            )}
          </div>

          {/* PIN */}
          <div className="mb-6">
            <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-1">
              PIN (4 Ziffern)
            </label>
            <input
              id="pin"
              type="password"
              value={form.pin}
              onChange={handleChange('pin')}
              maxLength={4}
              inputMode="numeric"
              autoComplete="current-password"
              aria-invalid={errors.pin ? 'true' : undefined}
              aria-describedby={errors.pin ? 'pin-error' : undefined}
              aria-required="true"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors ${
                errors.pin
                  ? 'border-red-400 bg-red-50'
                  : 'border-gray-300 bg-white hover:border-gray-400'
              }`}
              placeholder="••••"
            />
            {errors.pin && (
              <p id="pin-error" className="mt-1 text-xs text-red-600" role="alert">
                {errors.pin}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className="w-full py-2.5 px-4 bg-blue-600 text-white font-medium rounded-lg text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Wird angemeldet…' : 'Anmelden'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/register"
            className="text-blue-600 hover:text-blue-700 text-sm underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
          >
            Noch kein Konto? Jetzt registrieren
          </Link>
        </div>
      </div>
    </main>
  );
}

export default LoginPage;
