import { useAuth } from '@lernplattform/shared';

interface ProfileSectionProps {
  /** Total completed exercises across all courses. */
  totalCompleted: number;
  /** Total exercises across all courses. */
  totalExercises: number;
}

/**
 * Profile section shown on the landing page when the user is logged in.
 * Displays a greeting, progress summary, and logout button.
 */
export function ProfileSection({ totalCompleted, totalExercises }: ProfileSectionProps) {
  const { isLoggedIn, user, logout } = useAuth();

  if (!isLoggedIn || !user) {
    return null;
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
