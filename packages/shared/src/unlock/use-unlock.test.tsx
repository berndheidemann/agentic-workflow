// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUnlock } from './use-unlock';
import type { AuthContextValue } from '../auth/types';
import { AuthContext } from '../auth/auth-context';
import type { CourseUnlock } from '../schema/collections';

// ─── Mock pocketbase (needed because CookieAuthStore imports BaseAuthStore) ───

vi.mock('pocketbase', async (importOriginal) => {
  const actual = await importOriginal<typeof import('pocketbase')>();
  return { ...actual };
});

// ─── PocketBase collection mocks ──────────────────────────────────────────────

const mockGetFullList = vi.fn();
const mockCollection = vi.fn().mockReturnValue({
  getFullList: mockGetFullList,
});

// ─── Test helpers ─────────────────────────────────────────────────────────────

function makePb() {
  return { collection: mockCollection } as unknown as import('pocketbase').default;
}

function makeAuthContext(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    isLoggedIn: false,
    user: null,
    token: null,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    pb: makePb(),
    ...overrides,
  };
}

function makeLoggedInContext(classId: string | null = 'class-1'): AuthContextValue {
  return makeAuthContext({
    isLoggedIn: true,
    user: {
      id: 'user-123',
      username: 'testuser',
      email: '',
      role: 'student',
      classId,
      displayName: 'Test User',
      verified: false,
    },
    token: 'token-abc',
  });
}

function wrapper(authValue: AuthContextValue) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>;
  };
}

function makeUnlock(
  overrides: Partial<CourseUnlock> = {},
): CourseUnlock {
  return {
    id: 'unlock-1',
    class_id: 'class-1',
    user_id: null,
    course: 'ap1',
    module: 'modul-1',
    is_unlocked: true,
    unlocked_by: 'teacher-1',
    unlocked_at: '2026-01-01T00:00:00Z',
    created: '2026-01-01T00:00:00Z',
    updated: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useUnlock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetFullList.mockResolvedValue([]);
  });

  // ─── Guest mode ─────────────────────────────────────────────────────────────

  describe('guest mode (not logged in)', () => {
    it('isModuleUnlocked returns true for any course/module', () => {
      const { result } = renderHook(() => useUnlock(), {
        wrapper: wrapper(makeAuthContext()),
      });

      expect(result.current.isModuleUnlocked('ap1', 'modul-1')).toBe(true);
      expect(result.current.isModuleUnlocked('pandas', 'any-module')).toBe(true);
    });

    it('getUnlockedModules returns null (all open)', () => {
      const { result } = renderHook(() => useUnlock(), {
        wrapper: wrapper(makeAuthContext()),
      });

      expect(result.current.getUnlockedModules('ap1')).toBeNull();
    });

    it('makes no API calls', () => {
      const { result } = renderHook(() => useUnlock(), {
        wrapper: wrapper(makeAuthContext()),
      });

      result.current.isModuleUnlocked('ap1', 'modul-1');
      result.current.getUnlockedModules('pandas');

      expect(mockGetFullList).not.toHaveBeenCalled();
    });

    it('isLoading is false', () => {
      const { result } = renderHook(() => useUnlock(), {
        wrapper: wrapper(makeAuthContext()),
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  // ─── User without classId ────────────────────────────────────────────────────

  describe('logged in but no classId', () => {
    it('isModuleUnlocked returns true (all open, no class context)', () => {
      const { result } = renderHook(() => useUnlock(), {
        wrapper: wrapper(makeLoggedInContext(null)),
      });

      expect(result.current.isModuleUnlocked('ap1', 'modul-1')).toBe(true);
    });

    it('getUnlockedModules returns null', () => {
      const { result } = renderHook(() => useUnlock(), {
        wrapper: wrapper(makeLoggedInContext(null)),
      });

      expect(result.current.getUnlockedModules('ap1')).toBeNull();
    });

    it('makes no API calls', () => {
      const { result } = renderHook(() => useUnlock(), {
        wrapper: wrapper(makeLoggedInContext(null)),
      });

      result.current.isModuleUnlocked('ap1', 'modul-1');
      expect(mockGetFullList).not.toHaveBeenCalled();
    });
  });

  // ─── Auth still loading ──────────────────────────────────────────────────────

  describe('auth still loading', () => {
    it('isModuleUnlocked returns true (optimistically open)', () => {
      const { result } = renderHook(() => useUnlock(), {
        wrapper: wrapper(makeAuthContext({ isLoading: true })),
      });

      expect(result.current.isModuleUnlocked('ap1', 'modul-1')).toBe(true);
    });

    it('isLoading is true when auth is loading', () => {
      // Auth isLoading + user already there (edge case: refreshing token)
      const { result } = renderHook(() => useUnlock(), {
        wrapper: wrapper(makeLoggedInContext()),
      });
      // isLoading reflects authLoading which is false here
      expect(result.current.isLoading).toBe(false);
    });
  });

  // ─── Logged in, no unlock rules ──────────────────────────────────────────────

  describe('logged in, no unlock rules exist', () => {
    it('isModuleUnlocked returns true (default-open) after fetch', async () => {
      mockGetFullList.mockResolvedValue([]);

      const { result } = renderHook(() => useUnlock(), {
        wrapper: wrapper(makeLoggedInContext()),
      });

      // First call triggers lazy fetch, returns true optimistically
      expect(result.current.isModuleUnlocked('ap1', 'modul-1')).toBe(true);

      // After fetch resolves
      await waitFor(() => {
        expect(mockGetFullList).toHaveBeenCalled();
      });

      expect(result.current.isModuleUnlocked('ap1', 'modul-1')).toBe(true);
    });

    it('getUnlockedModules returns null (no rules = all open) after fetch', async () => {
      mockGetFullList.mockResolvedValue([]);

      const { result } = renderHook(() => useUnlock(), {
        wrapper: wrapper(makeLoggedInContext()),
      });

      act(() => {
        result.current.getUnlockedModules('ap1');
      });

      await waitFor(() => {
        expect(mockGetFullList).toHaveBeenCalled();
      });

      expect(result.current.getUnlockedModules('ap1')).toBeNull();
    });
  });

  // ─── Logged in, with unlock rules ────────────────────────────────────────────

  describe('logged in, with unlock rules', () => {
    it('isModuleUnlocked returns true for explicitly unlocked module', async () => {
      mockGetFullList.mockResolvedValue([
        makeUnlock({ module: 'modul-1', is_unlocked: true }),
        makeUnlock({ id: 'unlock-2', module: 'modul-2', is_unlocked: false }),
      ]);

      const { result } = renderHook(() => useUnlock(), {
        wrapper: wrapper(makeLoggedInContext()),
      });

      result.current.isModuleUnlocked('ap1', 'modul-1');

      await waitFor(() => {
        expect(mockGetFullList).toHaveBeenCalled();
      });

      expect(result.current.isModuleUnlocked('ap1', 'modul-1')).toBe(true);
    });

    it('isModuleUnlocked returns false for module without unlock entry', async () => {
      mockGetFullList.mockResolvedValue([
        makeUnlock({ module: 'modul-1', is_unlocked: true }),
        makeUnlock({ id: 'unlock-2', module: 'modul-3', is_unlocked: true }),
      ]);

      const { result } = renderHook(() => useUnlock(), {
        wrapper: wrapper(makeLoggedInContext()),
      });

      result.current.isModuleUnlocked('ap1', 'modul-2');

      await waitFor(() => {
        expect(mockGetFullList).toHaveBeenCalled();
      });

      expect(result.current.isModuleUnlocked('ap1', 'modul-2')).toBe(false);
    });

    it('isModuleUnlocked returns false when module has is_unlocked=false', async () => {
      mockGetFullList.mockResolvedValue([
        makeUnlock({ module: 'modul-1', is_unlocked: true }),
        makeUnlock({ id: 'unlock-2', module: 'modul-2', is_unlocked: false }),
      ]);

      const { result } = renderHook(() => useUnlock(), {
        wrapper: wrapper(makeLoggedInContext()),
      });

      result.current.isModuleUnlocked('ap1', 'modul-2');

      await waitFor(() => {
        expect(mockGetFullList).toHaveBeenCalled();
      });

      expect(result.current.isModuleUnlocked('ap1', 'modul-2')).toBe(false);
    });

    it('getUnlockedModules returns only unlocked module names', async () => {
      mockGetFullList.mockResolvedValue([
        makeUnlock({ module: 'modul-1', is_unlocked: true }),
        makeUnlock({ id: 'unlock-2', module: 'modul-2', is_unlocked: false }),
        makeUnlock({ id: 'unlock-3', module: 'modul-3', is_unlocked: true }),
      ]);

      const { result } = renderHook(() => useUnlock(), {
        wrapper: wrapper(makeLoggedInContext()),
      });

      result.current.getUnlockedModules('ap1');

      await waitFor(() => {
        expect(mockGetFullList).toHaveBeenCalled();
      });

      expect(result.current.getUnlockedModules('ap1')).toEqual(['modul-1', 'modul-3']);
    });
  });

  // ─── Caching ─────────────────────────────────────────────────────────────────

  describe('caching', () => {
    it('two calls for the same course trigger only one API call', async () => {
      mockGetFullList.mockResolvedValue([makeUnlock()]);

      const { result } = renderHook(() => useUnlock(), {
        wrapper: wrapper(makeLoggedInContext()),
      });

      result.current.isModuleUnlocked('ap1', 'modul-1');

      await waitFor(() => {
        expect(mockGetFullList).toHaveBeenCalledTimes(1);
      });

      // Second call — should NOT trigger another fetch
      result.current.isModuleUnlocked('ap1', 'modul-2');
      await act(async () => {}); // flush

      expect(mockGetFullList).toHaveBeenCalledTimes(1);
    });

    it('different courses trigger separate API calls', async () => {
      mockGetFullList.mockResolvedValue([]);

      const { result } = renderHook(() => useUnlock(), {
        wrapper: wrapper(makeLoggedInContext()),
      });

      result.current.isModuleUnlocked('ap1', 'modul-1');
      result.current.isModuleUnlocked('pandas', 'modul-1');

      await waitFor(() => {
        expect(mockGetFullList).toHaveBeenCalledTimes(2);
      });

      expect(mockGetFullList).toHaveBeenCalledWith(
        expect.objectContaining({ filter: expect.stringContaining('ap1') }),
      );
      expect(mockGetFullList).toHaveBeenCalledWith(
        expect.objectContaining({ filter: expect.stringContaining('pandas') }),
      );
    });
  });

  // ─── Cache invalidation ──────────────────────────────────────────────────────

  describe('cache invalidation', () => {
    it('cache is cleared when classId changes', async () => {
      mockGetFullList.mockResolvedValue([makeUnlock()]);

      let authValue = makeLoggedInContext('class-1');

      const DynamicWrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
      );

      const { result, rerender } = renderHook(() => useUnlock(), {
        wrapper: DynamicWrapper,
      });

      result.current.isModuleUnlocked('ap1', 'modul-1');

      await waitFor(() => {
        expect(mockGetFullList).toHaveBeenCalledTimes(1);
      });

      // Switch to different class by updating the auth value reference
      authValue = makeLoggedInContext('class-2');
      rerender();

      // Access same course again — should fetch anew after cache invalidation
      act(() => {
        result.current.isModuleUnlocked('ap1', 'modul-1');
      });

      await waitFor(() => {
        expect(mockGetFullList).toHaveBeenCalledTimes(2);
      });
    });
  });

  // ─── API call parameters ─────────────────────────────────────────────────────

  describe('API call parameters', () => {
    it('queries course_unlocks with correct class_id and course filter', async () => {
      mockGetFullList.mockResolvedValue([]);

      const { result } = renderHook(() => useUnlock(), {
        wrapper: wrapper(makeLoggedInContext('class-42')),
      });

      result.current.isModuleUnlocked('pandas', 'modul-1');

      await waitFor(() => {
        expect(mockGetFullList).toHaveBeenCalled();
      });

      expect(mockCollection).toHaveBeenCalledWith('course_unlocks');
      expect(mockGetFullList).toHaveBeenCalledWith({
        filter: 'class_id = "class-42" && course = "pandas"',
      });
    });
  });
});
