// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProgress } from './use-progress';
import type { AuthContextValue } from '../auth/types';
import { AuthContext } from '../auth/auth-context';

// ─── Mock pocketbase (needed because CookieAuthStore imports BaseAuthStore) ───

vi.mock('pocketbase', async (importOriginal) => {
  const actual = await importOriginal<typeof import('pocketbase')>();
  return { ...actual };
});

// ─── PocketBase collection mocks ──────────────────────────────────────────────

const mockCreate = vi.fn();
const mockGetFullList = vi.fn();
const mockCollection = vi.fn().mockReturnValue({
  create: mockCreate,
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

function makeLoggedInContext(): AuthContextValue {
  return makeAuthContext({
    isLoggedIn: true,
    user: {
      id: 'user-123',
      username: 'testuser',
      email: '',
      role: 'student',
      classId: 'class-1',
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

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set a default window.location.pathname for tests
    Object.defineProperty(window, 'location', {
      value: { pathname: '/ap1/modul-1/lektion-1/' },
      writable: true,
      configurable: true,
    });
  });

  describe('guest mode (not logged in)', () => {
    it('returns no-op functions and zero counts', () => {
      const { result } = renderHook(() => useProgress(), {
        wrapper: wrapper(makeAuthContext()),
      });

      expect(result.current.pendingCount).toBe(0);
      expect(result.current.isSyncing).toBe(false);
    });

    it('reportComplete is a no-op (no API calls)', () => {
      const { result } = renderHook(() => useProgress(), {
        wrapper: wrapper(makeAuthContext()),
      });

      act(() => {
        result.current.reportComplete('ex-1', 1, 1);
      });

      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('getProgress returns empty array without API calls', async () => {
      const { result } = renderHook(() => useProgress(), {
        wrapper: wrapper(makeAuthContext()),
      });

      const progress = await result.current.getProgress('ap1');
      expect(progress).toEqual([]);
      expect(mockGetFullList).not.toHaveBeenCalled();
    });
  });

  describe('logged in mode', () => {
    it('returns pendingCount and isSyncing', () => {
      const { result } = renderHook(() => useProgress(), {
        wrapper: wrapper(makeLoggedInContext()),
      });

      expect(result.current.pendingCount).toBe(0);
      expect(result.current.isSyncing).toBe(false);
    });

    it('reportComplete enqueues an entry (pendingCount increases)', () => {
      const { result } = renderHook(() => useProgress(), {
        wrapper: wrapper(makeLoggedInContext()),
      });

      act(() => {
        result.current.reportComplete('ex-1', 1, 1);
      });

      expect(result.current.pendingCount).toBe(1);
    });

    it('reportComplete uses URL to derive course and lesson', async () => {
      mockCreate.mockResolvedValue({});
      const { result, unmount } = renderHook(() => useProgress(), {
        wrapper: wrapper(makeLoggedInContext()),
      });

      act(() => {
        result.current.reportComplete('ex-1', 1, 1);
      });

      // Force flush by unmounting (engine.stop() is called in cleanup)
      await act(async () => {
        unmount();
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          course: 'ap1',
          lesson: 'modul-1/lektion-1',
          exercise: 'ex-1',
          user_id: 'user-123',
        })
      );
    });

    it('exercise-complete CustomEvent is handled', () => {
      const { result } = renderHook(() => useProgress(), {
        wrapper: wrapper(makeLoggedInContext()),
      });

      act(() => {
        window.dispatchEvent(
          new CustomEvent('exercise-complete', {
            detail: { exerciseId: 'ex-2', score: 3, maxScore: 5 },
          })
        );
      });

      expect(result.current.pendingCount).toBe(1);
    });

    it('exercise-complete CustomEvent maps detail fields correctly', async () => {
      mockCreate.mockResolvedValue({});
      const { unmount } = renderHook(() => useProgress(), {
        wrapper: wrapper(makeLoggedInContext()),
      });

      act(() => {
        window.dispatchEvent(
          new CustomEvent('exercise-complete', {
            detail: { exerciseId: 'ex-2', score: 3, maxScore: 5 },
          })
        );
      });

      await act(async () => {
        unmount();
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          exercise: 'ex-2',
          score: 3,
          max_score: 5,
          status: 'started', // 3 < 5
        })
      );
    });

    it('getProgress calls PocketBase with correct filter', async () => {
      mockGetFullList.mockResolvedValue([]);
      const { result } = renderHook(() => useProgress(), {
        wrapper: wrapper(makeLoggedInContext()),
      });

      await act(async () => {
        await result.current.getProgress('ap1');
      });

      expect(mockGetFullList).toHaveBeenCalledWith({
        filter: 'user_id = "user-123" && course = "ap1"',
        sort: 'lesson,exercise',
      });
    });

    it('cleans up event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      const { unmount } = renderHook(() => useProgress(), {
        wrapper: wrapper(makeLoggedInContext()),
      });

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'exercise-complete',
        expect.any(Function)
      );
    });
  });

  describe('URL without course segment', () => {
    it('reportComplete is a no-op when URL has no course segment', () => {
      Object.defineProperty(window, 'location', {
        value: { pathname: '/' },
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useProgress(), {
        wrapper: wrapper(makeLoggedInContext()),
      });

      act(() => {
        result.current.reportComplete('ex-1', 1, 1);
      });

      expect(result.current.pendingCount).toBe(0);
    });
  });
});
