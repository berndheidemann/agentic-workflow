import { useState } from 'react';
import { useAuth } from './use-auth';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LoginBannerProps {
  /** URL of the login page on the hub. Default: '/login' */
  loginHref?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Banner shown to guests (non-logged-in users) encouraging them to log in.
 * Dismissable via close button. Hidden when user is logged in.
 */
export function LoginBanner({ loginHref = '/login' }: LoginBannerProps) {
  const { isLoggedIn } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (isLoggedIn || dismissed) {
    return null;
  }

  return (
    <aside
      role="complementary"
      aria-label="Anmelde-Hinweis"
      className="flex items-center justify-between gap-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800"
    >
      <p>
        <a
          href={loginHref}
          className="font-medium underline hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
        >
          Melde dich an
        </a>
        {' '}um deinen Fortschritt zu speichern.
      </p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Hinweis schließen"
        className="flex-shrink-0 rounded p-1 text-blue-600 hover:bg-blue-100 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
      >
        <svg
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </aside>
  );
}
