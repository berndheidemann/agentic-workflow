// @vitest-environment jsdom
import '@testing-library/jest-dom';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { UnlockGate } from './unlock-gate';
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
    register: vi.fn(),
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

function renderGate(
  authValue: AuthContextValue,
  props: { course: string; module: string; fallback?: React.ReactNode }
) {
  return render(
    <AuthContext.Provider value={authValue}>
      <UnlockGate {...props}>
        <div data-testid="protected-content">Protected Content</div>
      </UnlockGate>
    </AuthContext.Provider>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('UnlockGate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetFullList.mockResolvedValue([]);
  });

  describe('Guest mode (not logged in)', () => {
    it('shows content when user is not logged in', () => {
      const ctx = makeAuthContext({ isLoggedIn: false, user: null });
      renderGate(ctx, { course: 'ap1', module: 'netzwerk' });

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Logged in, no class', () => {
    it('shows content when user has no class assigned', () => {
      const ctx = makeLoggedInContext(null);
      renderGate(ctx, { course: 'ap1', module: 'netzwerk' });

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  describe('Module unlocked', () => {
    it('shows content when module is unlocked', async () => {
      const unlockRecord: CourseUnlock = {
        id: 'u1',
        collectionId: 'course_unlocks',
        collectionName: 'course_unlocks',
        created: '',
        updated: '',
        class_id: 'class-1',
        course: 'ap1',
        module: 'netzwerk',
        is_unlocked: true,
      };
      mockGetFullList.mockResolvedValue([unlockRecord]);

      const ctx = makeLoggedInContext('class-1');
      renderGate(ctx, { course: 'ap1', module: 'netzwerk' });

      // Initially shows content (optimistic open while loading)
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();

      // After fetch, still shows content (module is unlocked)
      await waitFor(() => {
        expect(mockGetFullList).toHaveBeenCalled();
      });
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  describe('Module locked', () => {
    it('shows lock message when module is locked', async () => {
      const unlockRecord: CourseUnlock = {
        id: 'u1',
        collectionId: 'course_unlocks',
        collectionName: 'course_unlocks',
        created: '',
        updated: '',
        class_id: 'class-1',
        course: 'ap1',
        module: 'netzwerk',
        is_unlocked: false,
      };
      mockGetFullList.mockResolvedValue([unlockRecord]);

      const ctx = makeLoggedInContext('class-1');
      renderGate(ctx, { course: 'ap1', module: 'netzwerk' });

      // After fetch resolves, should show lock message
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.getByText('Dieses Modul wurde noch nicht freigeschaltet.')).toBeInTheDocument();
    });

    it('shows custom fallback when provided and module is locked', async () => {
      const unlockRecord: CourseUnlock = {
        id: 'u1',
        collectionId: 'course_unlocks',
        collectionName: 'course_unlocks',
        created: '',
        updated: '',
        class_id: 'class-1',
        course: 'ap1',
        module: 'netzwerk',
        is_unlocked: false,
      };
      mockGetFullList.mockResolvedValue([unlockRecord]);

      const ctx = makeLoggedInContext('class-1');
      renderGate(ctx, {
        course: 'ap1',
        module: 'netzwerk',
        fallback: <div data-testid="custom-fallback">Gesperrt!</div>,
      });

      await waitFor(() => {
        expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('No unlock rules for course', () => {
    it('shows content when no unlock rules exist (default open)', async () => {
      mockGetFullList.mockResolvedValue([]);

      const ctx = makeLoggedInContext('class-1');
      renderGate(ctx, { course: 'ap1', module: 'netzwerk' });

      // With no rules, default is open
      await waitFor(() => {
        expect(mockGetFullList).toHaveBeenCalled();
      });
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  describe('Optimistic open while loading', () => {
    it('shows content immediately before fetch completes', () => {
      // Simulate a slow fetch
      mockGetFullList.mockReturnValue(new Promise(() => {}));

      const ctx = makeLoggedInContext('class-1');
      renderGate(ctx, { course: 'ap1', module: 'netzwerk' });

      // Content should be visible immediately (optimistic open)
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });
});
