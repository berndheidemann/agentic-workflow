// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { AuthContext } from '@lernplattform/shared';
import type { AuthContextValue } from '@lernplattform/shared';
import React from 'react';
import { useStudentProgress } from './use-student-progress';
import type { SiteConfig } from '../config/sites';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockGetFullList = vi.fn();

function makeAuthContext(): AuthContextValue {
  return {
    isLoggedIn: true,
    user: {
      id: 'teacher-1',
      username: 'lehrer',
      email: '',
      role: 'teacher',
      classId: null,
      displayName: '',
      verified: true,
    },
    token: 'tok',
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    pb: {
      collection: () => ({
        getFullList: mockGetFullList,
      }),
    } as unknown as AuthContextValue['pb'],
  };
}

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(AuthContext.Provider, { value: makeAuthContext() }, children);
}

const MOCK_SITES: SiteConfig[] = [
  {
    slug: 'ap1',
    name: 'AP1-Trainer',
    description: '',
    icon: '',
    basePath: '/ap1/',
    frameworkType: 'starlight',
    isActive: true,
    sortOrder: 1,
    totalExercises: 10,
    modules: [],
  },
  {
    slug: 'pandas',
    name: 'Pandas',
    description: '',
    icon: '',
    basePath: '/pandas/',
    frameworkType: 'starlight',
    isActive: true,
    sortOrder: 2,
    totalExercises: 5,
    modules: [],
  },
];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useStudentProgress', () => {
  beforeEach(() => {
    mockGetFullList.mockReset();
  });

  it('returns empty results when studentId is null', () => {
    const { result } = renderHook(
      () => useStudentProgress(null, MOCK_SITES),
      { wrapper }
    );
    expect(result.current.courses).toHaveLength(0);
    expect(result.current.totalCompleted).toBe(0);
    expect(result.current.isLoading).toBe(false);
    expect(mockGetFullList).not.toHaveBeenCalled();
  });

  it('loads progress and groups by course', async () => {
    mockGetFullList.mockResolvedValueOnce([
      { course: 'ap1', lesson: 'lektion-1' },
      { course: 'ap1', lesson: 'lektion-2' },
      { course: 'pandas', lesson: 'lektion-1' },
    ]);

    const { result } = renderHook(
      () => useStudentProgress('student-1', MOCK_SITES),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const ap1 = result.current.courses.find((c) => c.courseSlug === 'ap1');
    const pandas = result.current.courses.find((c) => c.courseSlug === 'pandas');

    expect(ap1?.completedExercises).toBe(2);
    expect(pandas?.completedExercises).toBe(1);
  });

  it('calculates percentage correctly', async () => {
    mockGetFullList.mockResolvedValueOnce([
      { course: 'ap1', lesson: 'l1' },
      { course: 'ap1', lesson: 'l2' },
      { course: 'ap1', lesson: 'l3' },
      { course: 'ap1', lesson: 'l4' },
      { course: 'ap1', lesson: 'l5' },
    ]);

    const { result } = renderHook(
      () => useStudentProgress('student-1', MOCK_SITES),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const ap1 = result.current.courses.find((c) => c.courseSlug === 'ap1');
    // 5/10 = 50%
    expect(ap1?.percentage).toBe(50);
  });

  it('calculates total sum across all courses', async () => {
    mockGetFullList.mockResolvedValueOnce([
      { course: 'ap1', lesson: 'l1' },
      { course: 'ap1', lesson: 'l2' },
      { course: 'pandas', lesson: 'l1' },
    ]);

    const { result } = renderHook(
      () => useStudentProgress('student-1', MOCK_SITES),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.totalCompleted).toBe(3);
    expect(result.current.totalExercises).toBe(15); // 10 + 5
    expect(result.current.totalPercentage).toBe(20); // 3/15 = 20%
  });

  it('returns error on API failure', async () => {
    mockGetFullList.mockRejectedValueOnce(new Error('Netzwerkfehler'));

    const { result } = renderHook(
      () => useStudentProgress('student-1', MOCK_SITES),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toMatch(/Fortschrittsdaten konnten nicht geladen werden/);
    expect(result.current.courses).toHaveLength(0);
  });

  it('refetches when studentId changes', async () => {
    mockGetFullList
      .mockResolvedValueOnce([{ course: 'ap1', lesson: 'l1' }])
      .mockResolvedValueOnce([{ course: 'ap1', lesson: 'l1' }, { course: 'ap1', lesson: 'l2' }]);

    const { result, rerender } = renderHook(
      ({ id }: { id: string }) => useStudentProgress(id, MOCK_SITES),
      { wrapper, initialProps: { id: 'student-1' } }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.totalCompleted).toBe(1);

    rerender({ id: 'student-2' });

    await waitFor(() => expect(result.current.totalCompleted).toBe(2));
    expect(mockGetFullList).toHaveBeenCalledTimes(2);
  });
});
