import { Navigate } from 'react-router-dom';
import { useAuth } from '@lernplattform/shared';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Required role to access the route. If not set, only login is required. */
  role?: 'teacher' | 'student';
  /** Where to redirect unauthenticated users. Default: '/login' */
  redirectTo?: string;
}

/**
 * Protects a route behind authentication and optional role check.
 * - Redirects to /login if not logged in (or still loading)
 * - Redirects to / if logged in but wrong role
 */
export function ProtectedRoute({
  children,
  role,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { isLoggedIn, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        aria-live="polite"
        aria-busy="true"
      >
        <p className="text-gray-500">Laden…</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to={redirectTo} replace />;
  }

  if (role && user?.role !== role) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
