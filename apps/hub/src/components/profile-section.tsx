import { Link } from 'react-router-dom';
import { useAuth } from '@lernplattform/shared';

interface ProfileSectionProps {
  /** Total completed exercises across all courses. */
  totalCompleted: number;
  /** Total exercises across all courses. */
  totalExercises: number;
}

/**
 * Profile section shown on the landing page.
 * Logged in: greeting, progress summary, logout button.
 * Guest: call-to-action with login/register links.
 */
export function ProfileSection({ totalCompleted, totalExercises }: ProfileSectionProps) {
  const { isLoggedIn, user, logout } = useAuth();

  if (!isLoggedIn || !user) {
    return (
      <aside
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-8"
        aria-label="Anmeldung"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-gray-700">
            Melde dich an, um deinen Lernfortschritt zu speichern.
          </p>
          <div className="flex gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Anmelden
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Registrieren
            </Link>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-8"
      aria-label="Profil"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-gray-900">
            Hallo {user.username}!{' '}
            <span className="font-normal text-gray-600">
              Du hast {totalCompleted} von {totalExercises} Aufgaben geschafft.
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="self-start sm:self-auto px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
          aria-label="Abmelden"
        >
          Abmelden
        </button>
      </div>
    </aside>
  );
}
