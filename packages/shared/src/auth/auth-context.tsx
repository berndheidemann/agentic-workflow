import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AuthContextValue, AuthProviderProps, AuthState, AuthUser } from './types';
import { createPocketBaseClient } from './pb-client';
import type { UserRole } from '../schema/collections';
import type { AuthRecord } from 'pocketbase';

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapRecordToUser(record: AuthRecord): AuthUser | null {
  if (!record) return null;
  return {
    id: (record['id'] as string) ?? '',
    username: (record['username'] as string) ?? '',
    email: (record['email'] as string) ?? '',
    role: (record['role'] as UserRole) ?? 'student',
    classId: (record['class_id'] as string | null) ?? null,
    displayName: (record['display_name'] as string) ?? '',
    verified: (record['verified'] as boolean) ?? false,
  };
}

function buildAuthState(token: string, record: AuthRecord): AuthState {
  const hasToken = !!token;
  return {
    isLoggedIn: hasToken,
    user: hasToken ? mapRecordToUser(record) : null,
    token: hasToken ? token : null,
    isLoading: false,
  };
}

// ─── AuthProvider ─────────────────────────────────────────────────────────────

export function AuthProvider({ children, baseUrl = '', cookieOptions }: AuthProviderProps) {
  const pbRef = useRef(createPocketBaseClient(baseUrl, cookieOptions));
  const pb = pbRef.current;

  const [authState, setAuthState] = useState<AuthState>(() => ({
    isLoggedIn: pb.authStore.isValid,
    user: pb.authStore.isValid ? mapRecordToUser(pb.authStore.record) : null,
    token: pb.authStore.isValid ? pb.authStore.token : null,
    isLoading: true,
  }));

  // Subscribe to authStore changes and sync React state
  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((token, record) => {
      setAuthState(buildAuthState(token, record));
    });

    // If we already have a valid token (from cookie), validate with server
    // and set isLoading=false either way.
    if (pb.authStore.isValid) {
      pb.collection('users')
        .authRefresh()
        .then(() => {
          setAuthState((prev) => ({ ...prev, isLoading: false }));
        })
        .catch(() => {
          pb.authStore.clear();
          setAuthState({
            isLoggedIn: false,
            user: null,
            token: null,
            isLoading: false,
          });
        });
    } else {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    }

    return unsubscribe;
  }, [pb]);

  const login = useCallback(
    async (username: string, pin: string): Promise<void> => {
      await pb.collection('users').authWithPassword(username, pin);
      // State update happens via onChange callback
    },
    [pb]
  );

  const register = useCallback(
    async (username: string, pin: string, classCode: string): Promise<void> => {
      // The join_code is resolved server-side by the user-validation hook.
      // Sending it as a body field — not a schema field — avoids client-side
      // class lookup which would require auth on the classes collection.
      await pb.collection('users').create({
        username,
        password: pin,
        passwordConfirm: pin,
        join_code: classCode,
      });
      // Auto-login after successful registration
      await pb.collection('users').authWithPassword(username, pin);
      // State update happens via onChange callback
    },
    [pb]
  );

  const logout = useCallback((): void => {
    pb.authStore.clear();
    // State update happens via onChange callback
  }, [pb]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...authState,
      login,
      register,
      logout,
      pb,
    }),
    [authState, login, register, logout, pb]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Internal context export ──────────────────────────────────────────────────

export { AuthContext };
