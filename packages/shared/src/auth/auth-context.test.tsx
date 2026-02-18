// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider } from './auth-context';
import { useAuth } from './use-auth';
import type { RecordModel } from 'pocketbase';

// ─── Mock setup ───────────────────────────────────────────────────────────────
// We mock only the PocketBase SDK network calls (external API calls).
// AuthProvider, useAuth, CookieAuthStore are used REAL.
//
// The challenge: authWithPassword must call pb.authStore.save() to trigger
// the onChange callback. We achieve this by mocking the collection service
// but having authWithPassword call the real authStore.save().

// Mock pocketbase module — replace collection().authWithPassword with a version
// that actually calls pb.authStore.save() so the onChange chain works
vi.mock('pocketbase', async (importOriginal) => {
  const actual = await importOriginal<typeof import('pocketbase')>();

  class MockPocketBase extends actual.default {
    constructor(
      baseUrl?: string,
      authStore?: ConstructorParameters<typeof actual.default>[1],
    ) {
      super(baseUrl, authStore);
    }

    override collection(_idOrName: string) {
      // Return a proxy service with mocked network methods.
      // Arrow function captures `this` implicitly (no alias needed).
      return {
        authWithPassword: vi.fn().mockImplementation(
          async (_username: string, _password: string) => {
            const record: RecordModel = {
              id: 'user1',
              username: 'testuser',
              email: 'test@example.com',
              role: 'student',
              class_id: 'class1',
              display_name: 'Test User',
              verified: false,
              collectionId: 'users',
              collectionName: 'users',
              created: '',
              updated: '',
              expand: {},
            };
            // Call the real authStore.save() so onChange fires and React state updates
            this.authStore.save('mock-jwt-token', record);
            return { token: 'mock-jwt-token', record };
          },
        ),
        authRefresh: vi.fn().mockRejectedValue(new Error('no valid token')),
      } as unknown as ReturnType<(typeof actual.default.prototype)['collection']>;
    }
  }

  return { ...actual, default: MockPocketBase };
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clearAllCookies() {
  if (typeof document === 'undefined') return;
  document.cookie.split(';').forEach((c) => {
    const key = c.split('=')[0].trim();
    if (key) {
      document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
  });
}

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider baseUrl="" cookieOptions={{ secure: false }}>
      {children}
    </AuthProvider>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useAuth', () => {
  beforeEach(() => {
    clearAllCookies();
    vi.clearAllMocks();
  });

  it('throws if used outside of AuthProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth muss innerhalb von <AuthProvider> verwendet werden.',
    );
    consoleSpy.mockRestore();
  });

  it('starts with isLoggedIn=false and user=null when no cookie exists', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isLoggedIn).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });

  it('login() sets isLoggedIn=true and user after success', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.login('testuser', '1234');
    });

    expect(result.current.isLoggedIn).toBe(true);
    expect(result.current.user).not.toBeNull();
    expect(result.current.user?.username).toBe('testuser');
  });

  it('user object has correct mapped fields after login', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.login('testuser', '1234');
    });

    const user = result.current.user!;
    expect(user.id).toBe('user1');
    expect(user.username).toBe('testuser');
    expect(user.role).toBe('student');
    expect(user.classId).toBe('class1');
    expect(user.displayName).toBe('Test User');
    expect(user.verified).toBe(false);
  });

  it('logout() resets state back to logged-out', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.login('testuser', '1234');
    });
    expect(result.current.isLoggedIn).toBe(true);

    act(() => {
      result.current.logout();
    });

    expect(result.current.isLoggedIn).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });

  it('exposes pb instance via useAuth()', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.pb).toBeDefined();
    expect(typeof result.current.pb.collection).toBe('function');
  });

  it('isLoading settles to false after initialization', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('token is set in authState after login', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.login('testuser', '1234');
    });

    expect(result.current.token).toBe('mock-jwt-token');
  });
});
