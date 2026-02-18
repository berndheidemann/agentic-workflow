import { useContext } from 'react';
import { AuthContext } from './auth-context';
import type { AuthContextValue } from './types';

/**
 * Hook to access the auth context.
 *
 * Must be used inside `<AuthProvider>`.
 * Throws if used outside of AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth muss innerhalb von <AuthProvider> verwendet werden.');
  }
  return ctx;
}
