// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePrerequisites, toDisplayName, buildPrerequisiteHref } from './use-prerequisites';
import type { AuthContextValue } from '../auth/types';
import { AuthContext } from '../auth/auth-context';
import type { Progress } from '../schema/collections';

// ─── Mock pocketbase ──────────────────────────────────────────────────────────

vi.mock('pocketbase', async (importOriginal) => {
  const actual = await importOriginal<typeof import('pocketbase')>();
  return { ...actual };
});

// ─── PocketBase mock ──────────────────────────────────────────────────────────

const mockGetFullList = vi.fn();
const mockCollection = vi.fn().mockReturnValue({ getFullList: mockGetFullList });

function makePb() {
  return { collection: mockCollection } as unknown as import('pocketbase').default;
}

// ─── Auth context helpers ─────────────────────────────────────────────────────

function makeAuthContext(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    isLoggedIn: false,
    user: null,
    token: null,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
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

function makeProgressRecord(overrides: Partial<Progress> = {}): Progress {
  return {
    id: 'prog-1',
    user_id: 'user-123',
    course: 'ap1',
    lesson: 'netzwerktechnik/ip-adressierung',
    exercise: 'ex-1',
    status: 'completed',
    score: 10,
    max_score: 10,
    attempts: 1,
    completed_at: '2026-01-01T00:00:00Z',
    suspicious: false,
    created: '2026-01-01T00:00:00Z',
    updated: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockCollection.mockReturnValue({ getFullList: mockGetFullList });
  Object.defineProperty(window, 'location', {
    value: { pathname: '/ap1/netzwerktechnik/subnetting/' },
    writable: true,
    configurable: true,
  });
});

// ─── toDisplayName ────────────────────────────────────────────────────────────

describe('toDisplayName', () => {
  it('converts kebab-case to title-case with dashes', () => {
    expect(toDisplayName('ip-adressierung')).toBe('Ip-Adressierung');
  });

  it('handles single word', () => {
    expect(toDisplayName('subnetting')).toBe('Subnetting');
  });

  it('converts multi-word slug', () => {
    expect(toDisplayName('osi-modell')).toBe('Osi-Modell');
  });

  it('uses only the last path segment', () => {
    expect(toDisplayName('netzwerktechnik/ip-adressierung')).toBe('Ip-Adressierung');
  });

  it('handles empty string gracefully', () => {
    expect(toDisplayName('')).toBe('');
  });
});

// ─── buildPrerequisiteHref ────────────────────────────────────────────────────

describe('buildPrerequisiteHref', () => {
  it('builds href from basePath and lessonPath', () => {
    expect(buildPrerequisiteHref('/ap1/', 'netzwerktechnik/ip-adressierung')).toBe(
      '/ap1/netzwerktechnik/ip-adressierung/'
    );
  });

  it('normalizes basePath without trailing slash', () => {
    expect(buildPrerequisiteHref('/ap1', 'netzwerktechnik/ip-adressierung')).toBe(
      '/ap1/netzwerktechnik/ip-adressierung/'
    );
  });
});

// ─── usePrerequisites ─────────────────────────────────────────────────────────

describe('usePrerequisites', () => {
  describe('guest mode (not logged in)', () => {
    it('returns isGuest=true and empty unmet array without API call', () => {
      const { result } = renderHook(
        () => usePrerequisites(['netzwerktechnik/ip-adressierung']),
        { wrapper: wrapper(makeAuthContext({ isLoggedIn: false })) }
      );

      expect(result.current.isGuest).toBe(true);
      expect(result.current.unmet).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(mockGetFullList).not.toHaveBeenCalled();
    });
  });

  describe('logged in', () => {
    it('returns empty unmet array when prerequisites is empty', async () => {
      mockGetFullList.mockResolvedValue([]);

      const { result } = renderHook(() => usePrerequisites([]), {
        wrapper: wrapper(makeLoggedInContext()),
      });

      await waitFor(() => !result.current.isLoading);

      expect(result.current.isGuest).toBe(false);
      expect(result.current.unmet).toEqual([]);
      expect(mockGetFullList).not.toHaveBeenCalled();
    });

    it('returns empty unmet array when all prerequisites are completed', async () => {
      mockGetFullList.mockResolvedValue([
        makeProgressRecord({ lesson: 'netzwerktechnik/ip-adressierung', status: 'completed' }),
      ]);

      const { result } = renderHook(
        () =>
          usePrerequisites(['netzwerktechnik/ip-adressierung'], {
            course: 'ap1',
            basePath: '/ap1/',
          }),
        { wrapper: wrapper(makeLoggedInContext()) }
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.unmet).toEqual([]);
      expect(result.current.isGuest).toBe(false);
    });

    it('returns unmet prerequisites when not completed', async () => {
      mockGetFullList.mockResolvedValue([]);

      const { result } = renderHook(
        () =>
          usePrerequisites(['netzwerktechnik/ip-adressierung'], {
            course: 'ap1',
            basePath: '/ap1/',
          }),
        { wrapper: wrapper(makeLoggedInContext()) }
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.unmet).toHaveLength(1);
      expect(result.current.unmet[0]).toMatchObject({
        lessonPath: 'netzwerktechnik/ip-adressierung',
        displayName: 'Ip-Adressierung',
        href: '/ap1/netzwerktechnik/ip-adressierung/',
      });
    });

    it('returns only unmet from a mixed list of prerequisites', async () => {
      mockGetFullList.mockResolvedValue([
        makeProgressRecord({ lesson: 'netzwerktechnik/ip-adressierung', status: 'completed' }),
      ]);

      const { result } = renderHook(
        () =>
          usePrerequisites(
            ['netzwerktechnik/ip-adressierung', 'netzwerktechnik/osi-modell'],
            { course: 'ap1', basePath: '/ap1/' }
          ),
        { wrapper: wrapper(makeLoggedInContext()) }
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.unmet).toHaveLength(1);
      expect(result.current.unmet[0].lessonPath).toBe('netzwerktechnik/osi-modell');
      expect(result.current.unmet[0].displayName).toBe('Osi-Modell');
    });

    it('returns all prerequisites as unmet when user has no progress', async () => {
      mockGetFullList.mockResolvedValue([]);

      const { result } = renderHook(
        () =>
          usePrerequisites(
            ['netzwerktechnik/ip-adressierung', 'netzwerktechnik/osi-modell'],
            { course: 'ap1', basePath: '/ap1/' }
          ),
        { wrapper: wrapper(makeLoggedInContext()) }
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.unmet).toHaveLength(2);
    });

    it('ignores "started" status — only "completed" counts', async () => {
      mockGetFullList.mockResolvedValue([
        makeProgressRecord({ lesson: 'netzwerktechnik/ip-adressierung', status: 'started' }),
      ]);

      const { result } = renderHook(
        () =>
          usePrerequisites(['netzwerktechnik/ip-adressierung'], {
            course: 'ap1',
            basePath: '/ap1/',
          }),
        { wrapper: wrapper(makeLoggedInContext()) }
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.unmet).toHaveLength(1);
    });

    it('ignores empty prerequisite strings', async () => {
      mockGetFullList.mockResolvedValue([]);

      const { result } = renderHook(
        () => usePrerequisites(['', '  '], { course: 'ap1', basePath: '/ap1/' }),
        { wrapper: wrapper(makeLoggedInContext()) }
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.unmet).toEqual([]);
    });

    it('derives course from URL when option is not provided', async () => {
      mockGetFullList.mockResolvedValue([]);

      const { result } = renderHook(
        () => usePrerequisites(['netzwerktechnik/ip-adressierung']),
        { wrapper: wrapper(makeLoggedInContext()) }
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Should have called getFullList with course="ap1" (from /ap1/netzwerktechnik/subnetting/)
      expect(mockGetFullList).toHaveBeenCalledWith(
        expect.objectContaining({ filter: expect.stringContaining('course = "ap1"') })
      );
    });

    it('returns empty unmet array on API error (fail-safe)', async () => {
      mockGetFullList.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(
        () =>
          usePrerequisites(['netzwerktechnik/ip-adressierung'], {
            course: 'ap1',
            basePath: '/ap1/',
          }),
        { wrapper: wrapper(makeLoggedInContext()) }
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.unmet).toEqual([]);
    });
  });
});
