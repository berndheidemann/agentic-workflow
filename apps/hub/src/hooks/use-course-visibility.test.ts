// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { AuthContextValue } from '@lernplattform/shared';
import { AuthContext } from '@lernplattform/shared';
import { createElement } from 'react';
import { useCourseVisibility } from './use-course-visibility';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockGetFullList = vi.fn();

function makeUser(
  role: 'student' | 'teacher' = 'student',
  classId: string | null = 'class-123',
) {
  return {
    id: 'user-1',
    username: 'testnutzer',
    email: 'test@example.com',
    role,
    classId,
    displayName: 'Test Nutzer',
    verified: true,
  };
}

function makeAuthContext(
  isLoggedIn: boolean,
  role: 'student' | 'teacher' = 'student',
  classId: string | null = 'class-123',
): AuthContextValue {
  return {
    isLoggedIn,
    user: isLoggedIn ? makeUser(role, classId) : null,
    token: isLoggedIn ? 'tok' : null,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    pb: {
      collection: () => ({ getFullList: mockGetFullList }),
    } as unknown as AuthContextValue['pb'],
  };
}

function renderWithAuth(
  isLoggedIn: boolean,
  role: 'student' | 'teacher' = 'student',
  classId: string | null = 'class-123',
) {
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    createElement(AuthContext.Provider, { value: makeAuthContext(isLoggedIn, role, classId) }, children);
  return renderHook(() => useCourseVisibility(), { wrapper });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useCourseVisibility', () => {
  beforeEach(() => {
    mockGetFullList.mockReset();
  });

  it('gibt null zurück im Gast-Modus (nicht eingeloggt)', async () => {
    const { result } = renderWithAuth(false);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.visibleCourses).toBeNull();
    expect(mockGetFullList).not.toHaveBeenCalled();
  });

  it('gibt null zurück für Lehrer (sieht immer alle Kurse)', async () => {
    const { result } = renderWithAuth(true, 'teacher', 'class-123');
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.visibleCourses).toBeNull();
    expect(mockGetFullList).not.toHaveBeenCalled();
  });

  it('gibt null zurück für Schüler ohne classId', async () => {
    const { result } = renderWithAuth(true, 'student', null);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.visibleCourses).toBeNull();
    expect(mockGetFullList).not.toHaveBeenCalled();
  });

  it('gibt null zurück wenn keine Unlock-Records existieren (Default-offen)', async () => {
    mockGetFullList.mockResolvedValue([]);
    const { result } = renderWithAuth(true, 'student', 'class-123');
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.visibleCourses).toBeNull();
  });

  it('gibt Set mit Kurs-Slugs zurück wenn Records existieren', async () => {
    mockGetFullList.mockResolvedValue([
      { course: 'ap1' },
      { course: 'pandas' },
      { course: 'ap1' }, // Duplikat — soll nur einmal im Set sein
      { course: 'zuul' },
    ]);
    const { result } = renderWithAuth(true, 'student', 'class-123');
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.visibleCourses).toEqual(new Set(['ap1', 'pandas', 'zuul']));
  });

  it('extrahiert nur unique course-Slugs aus mehreren Records pro Kurs', async () => {
    mockGetFullList.mockResolvedValue([
      { course: 'ap1' },
      { course: 'ap1' },
      { course: 'ap1' },
      { course: 'pandas' },
      { course: 'pandas' },
    ]);
    const { result } = renderWithAuth(true, 'student', 'class-123');
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.visibleCourses).toEqual(new Set(['ap1', 'pandas']));
    expect(result.current.visibleCourses?.size).toBe(2);
  });

  it('gibt null zurück bei API-Fehler (graceful degradation)', async () => {
    mockGetFullList.mockRejectedValue(new Error('Network error'));
    const { result } = renderWithAuth(true, 'student', 'class-123');
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.visibleCourses).toBeNull();
  });

  it('ist isLoading=true während des Ladens', async () => {
    let resolve: (value: unknown[]) => void = () => {};
    mockGetFullList.mockReturnValue(new Promise((res) => { resolve = res; }));
    const { result } = renderWithAuth(true, 'student', 'class-123');
    // Initially loading
    expect(result.current.isLoading).toBe(true);
    // Resolve and wait
    resolve([{ course: 'ap1' }]);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it('ruft API mit korrektem classId-Filter auf', async () => {
    mockGetFullList.mockResolvedValue([]);
    renderWithAuth(true, 'student', 'my-class-id');
    await waitFor(() => expect(mockGetFullList).toHaveBeenCalled());
    expect(mockGetFullList).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.stringContaining('my-class-id'),
      }),
    );
  });
});
