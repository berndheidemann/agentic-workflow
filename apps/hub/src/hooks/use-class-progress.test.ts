import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { AuthContext } from '@lernplattform/shared';
import type { AuthContextValue, Progress, User, CourseManifest } from '@lernplattform/shared';
import React from 'react';
import { useClassProgress, computeCellStatus } from './use-class-progress';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockGetFullList = vi.fn();

function makeAuthContext(): AuthContextValue {
  return {
    isLoggedIn: true,
    user: { id: 'teacher-1', username: 'lehrer', email: '', role: 'teacher', classId: null, displayName: '', verified: true },
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

function makeStudent(overrides: Partial<User> = {}): User {
  return {
    id: 'stu-1',
    username: 'anna',
    email: '',
    emailVisibility: false,
    verified: true,
    role: 'student',
    class_id: 'cls-1',
    display_name: '',
    created: '',
    updated: '',
    ...overrides,
  };
}

function makeProgress(overrides: Partial<Progress> = {}): Progress {
  return {
    id: 'prog-1',
    user_id: 'stu-1',
    course: 'ap1',
    lesson: 'lektion-1',
    exercise: 'aufgabe-1',
    status: 'completed',
    score: 10,
    max_score: 10,
    attempts: 1,
    completed_at: '2024-01-01T00:00:00Z',
    suspicious: false,
    created: '',
    updated: '',
    ...overrides,
  };
}

// ─── computeCellStatus Tests ──────────────────────────────────────────────────

describe('computeCellStatus', () => {
  it('returns unattempted for undefined progress', () => {
    expect(computeCellStatus(undefined)).toBe('unattempted');
  });

  it('returns correct for completed with score === max_score', () => {
    expect(computeCellStatus(makeProgress({ status: 'completed', score: 10, max_score: 10 }))).toBe('correct');
  });

  it('returns correct for completed with score > max_score (bonus)', () => {
    expect(computeCellStatus(makeProgress({ status: 'completed', score: 12, max_score: 10 }))).toBe('correct');
  });

  it('returns incorrect for started status', () => {
    expect(computeCellStatus(makeProgress({ status: 'started', score: 0, max_score: 10 }))).toBe('incorrect');
  });

  it('returns incorrect for completed with score < max_score', () => {
    expect(computeCellStatus(makeProgress({ status: 'completed', score: 5, max_score: 10 }))).toBe('incorrect');
  });
});

// ─── useClassProgress Tests ───────────────────────────────────────────────────

describe('useClassProgress', () => {
  beforeEach(() => {
    mockGetFullList.mockReset();
  });

  it('returns empty data when classId is null', () => {
    const { result } = renderHook(() => useClassProgress(null, 'ap1'), { wrapper });
    expect(result.current.columns).toEqual([]);
    expect(result.current.rows).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('returns empty data when course is null', () => {
    const { result } = renderHook(() => useClassProgress('cls-1', null), { wrapper });
    expect(result.current.columns).toEqual([]);
    expect(result.current.rows).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('does not call PocketBase when classId and course are null', () => {
    renderHook(() => useClassProgress(null, null), { wrapper });
    expect(mockGetFullList).not.toHaveBeenCalled();
  });

  it('loads students and progress in parallel', async () => {
    const student = makeStudent();
    const progress = makeProgress({ user_id: 'stu-1' });

    mockGetFullList
      .mockResolvedValueOnce([student])   // users call
      .mockResolvedValueOnce([progress]); // progress call

    const { result } = renderHook(() => useClassProgress('cls-1', 'ap1'), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.rows).toHaveLength(1);
    expect(result.current.rows[0].student.id).toBe('stu-1');
    expect(result.current.columns).toHaveLength(1);
    expect(result.current.columns[0].label).toBe('lektion-1/aufgabe-1');
  });

  it('builds correct cell status for each student', async () => {
    const student1 = makeStudent({ id: 'stu-1', username: 'anna' });
    const student2 = makeStudent({ id: 'stu-2', username: 'bert' });
    const correctProg = makeProgress({ id: 'p1', user_id: 'stu-1', status: 'completed', score: 10, max_score: 10 });
    const incorrectProg = makeProgress({ id: 'p2', user_id: 'stu-2', status: 'started', score: 0, max_score: 10 });

    mockGetFullList
      .mockResolvedValueOnce([student1, student2])
      .mockResolvedValueOnce([correctProg, incorrectProg]);

    const { result } = renderHook(() => useClassProgress('cls-1', 'ap1'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const key = 'lektion-1::aufgabe-1';
    expect(result.current.rows[0].cells.get(key)?.status).toBe('correct');
    expect(result.current.rows[1].cells.get(key)?.status).toBe('incorrect');
  });

  it('marks unattempted when student has no progress for a column', async () => {
    const student1 = makeStudent({ id: 'stu-1', username: 'anna' });
    const student2 = makeStudent({ id: 'stu-2', username: 'bert' });
    // Only student 1 has progress
    const prog = makeProgress({ id: 'p1', user_id: 'stu-1', status: 'completed', score: 10, max_score: 10 });

    mockGetFullList
      .mockResolvedValueOnce([student1, student2])
      .mockResolvedValueOnce([prog]);

    const { result } = renderHook(() => useClassProgress('cls-1', 'ap1'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const key = 'lektion-1::aufgabe-1';
    expect(result.current.rows[1].cells.get(key)?.status).toBe('unattempted');
  });

  it('sorts columns by lesson then exercise alphabetically', async () => {
    const student = makeStudent();
    const progA = makeProgress({ id: 'p1', lesson: 'lektion-2', exercise: 'aufgabe-1' });
    const progB = makeProgress({ id: 'p2', lesson: 'lektion-1', exercise: 'aufgabe-2' });
    const progC = makeProgress({ id: 'p3', lesson: 'lektion-1', exercise: 'aufgabe-1' });

    mockGetFullList
      .mockResolvedValueOnce([student])
      .mockResolvedValueOnce([progA, progB, progC]);

    const { result } = renderHook(() => useClassProgress('cls-1', 'ap1'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.columns[0].label).toBe('lektion-1/aufgabe-1');
    expect(result.current.columns[1].label).toBe('lektion-1/aufgabe-2');
    expect(result.current.columns[2].label).toBe('lektion-2/aufgabe-1');
  });

  it('excludes progress from students not in the class', async () => {
    const student = makeStudent({ id: 'stu-1' });
    // Progress from a different student (not in class)
    const outsiderProg = makeProgress({ id: 'p1', user_id: 'stu-999', lesson: 'lektion-x', exercise: 'x' });
    const ownProg = makeProgress({ id: 'p2', user_id: 'stu-1', lesson: 'lektion-1', exercise: 'aufgabe-1' });

    mockGetFullList
      .mockResolvedValueOnce([student])
      .mockResolvedValueOnce([outsiderProg, ownProg]);

    const { result } = renderHook(() => useClassProgress('cls-1', 'ap1'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Only 1 column (from stu-1), not 2
    expect(result.current.columns).toHaveLength(1);
    expect(result.current.columns[0].label).toBe('lektion-1/aufgabe-1');
  });

  it('sets error state on API failure', async () => {
    mockGetFullList.mockRejectedValueOnce(new Error('Netzwerkfehler'));

    const { result } = renderHook(() => useClassProgress('cls-1', 'ap1'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toContain('Netzwerkfehler');
    expect(result.current.columns).toEqual([]);
    expect(result.current.rows).toEqual([]);
  });

  it('shows isLoading=true initially then false after load', async () => {
    let resolveUsers!: (v: User[]) => void;
    mockGetFullList.mockImplementationOnce(() => new Promise((r) => { resolveUsers = r; }));
    mockGetFullList.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useClassProgress('cls-1', 'ap1'), { wrapper });
    expect(result.current.isLoading).toBe(true);

    resolveUsers([]);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it('sorts students by username alphabetically', async () => {
    const students = [
      makeStudent({ id: 'stu-2', username: 'zara' }),
      makeStudent({ id: 'stu-1', username: 'anna' }),
    ];
    const prog = makeProgress({ user_id: 'stu-1' });

    // PocketBase returns already sorted (sort: 'username'), simulate that
    mockGetFullList
      .mockResolvedValueOnce([students[1], students[0]]) // sorted by pb
      .mockResolvedValueOnce([prog]);

    const { result } = renderHook(() => useClassProgress('cls-1', 'ap1'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.rows[0].student.username).toBe('anna');
    expect(result.current.rows[1].student.username).toBe('zara');
  });

  // ─── REQ-037: Manifest-based columns ─────────────────────────────────────────

  it('REQ-037: mit Manifest werden Spalten aus Manifest abgeleitet, nicht aus Progress', async () => {
    const student = makeStudent();
    const manifest: CourseManifest = {
      version: 1,
      course: 'ap1',
      name: 'AP1-Trainer',
      generatedAt: '2026-02-19T00:00:00.000Z',
      totalExercises: 2,
      modules: [
        {
          id: 'netzwerktechnik',
          title: 'Netzwerktechnik',
          sortOrder: 1,
          lessons: [
            {
              slug: 'netzwerktechnik/ip-adressierung',
              title: 'IP-Adressierung',
              exercises: [
                { id: 'netzwerktechnik-ip-adressierung-01', title: 'Aufgabe 1', type: 'DragDrop', points: 6, difficulty: 1 },
                { id: 'netzwerktechnik-ip-adressierung-02', title: 'Aufgabe 2', type: 'MultipleChoice', points: 3, difficulty: 1 },
              ],
            },
          ],
        },
      ],
    };

    // Kein Progress-Record für Aufgabe 2 — aber Manifest kennt sie
    const prog = makeProgress({ exercise: 'netzwerktechnik-ip-adressierung-01', lesson: 'netzwerktechnik/ip-adressierung' });

    mockGetFullList
      .mockResolvedValueOnce([student])
      .mockResolvedValueOnce([prog]);

    const { result } = renderHook(() => useClassProgress('cls-1', 'ap1', manifest), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Beide Aufgaben sichtbar — auch die ohne Progress
    expect(result.current.columns).toHaveLength(2);
    expect(result.current.columns[0].exercise).toBe('netzwerktechnik-ip-adressierung-01');
    expect(result.current.columns[1].exercise).toBe('netzwerktechnik-ip-adressierung-02');
    expect(result.current.columns[0].label).toBe('Aufgabe 1');
  });

  it('REQ-037: Manifest-Spalten zeigen unattempted für Aufgaben ohne Progress', async () => {
    const student = makeStudent();
    const manifest: CourseManifest = {
      version: 1,
      course: 'ap1',
      name: 'AP1-Trainer',
      generatedAt: '2026-02-19T00:00:00.000Z',
      totalExercises: 1,
      modules: [
        {
          id: 'netzwerktechnik',
          title: 'Netzwerktechnik',
          sortOrder: 1,
          lessons: [
            {
              slug: 'netzwerktechnik/ip-adressierung',
              title: 'IP-Adressierung',
              exercises: [
                { id: 'netzwerktechnik-ip-adressierung-01', title: 'Nie versucht', type: 'DragDrop', points: 6, difficulty: 1 },
              ],
            },
          ],
        },
      ],
    };

    mockGetFullList
      .mockResolvedValueOnce([student])
      .mockResolvedValueOnce([]); // Kein Progress

    const { result } = renderHook(() => useClassProgress('cls-1', 'ap1', manifest), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.columns).toHaveLength(1);
    const cellKey = 'netzwerktechnik/ip-adressierung::netzwerktechnik-ip-adressierung-01';
    expect(result.current.rows[0].cells.get(cellKey)?.status).toBe('unattempted');
  });

  // ─── REQ-040: Suspicious flag ─────────────────────────────────────────────────

  it('REQ-040: setzt suspicious=true in Zelle wenn Progress.suspicious=true', async () => {
    const student = makeStudent();
    const prog = makeProgress({ suspicious: true, status: 'completed', score: 10, max_score: 10 });

    mockGetFullList
      .mockResolvedValueOnce([student])
      .mockResolvedValueOnce([prog]);

    const { result } = renderHook(() => useClassProgress('cls-1', 'ap1'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const key = 'lektion-1::aufgabe-1';
    expect(result.current.rows[0].cells.get(key)?.suspicious).toBe(true);
  });

  it('REQ-040: setzt suspicious=false wenn Progress.suspicious=false', async () => {
    const student = makeStudent();
    const prog = makeProgress({ suspicious: false });

    mockGetFullList
      .mockResolvedValueOnce([student])
      .mockResolvedValueOnce([prog]);

    const { result } = renderHook(() => useClassProgress('cls-1', 'ap1'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const key = 'lektion-1::aufgabe-1';
    expect(result.current.rows[0].cells.get(key)?.suspicious).toBe(false);
  });

  it('REQ-040: setzt suspicious=false wenn kein Progress-Eintrag (unattempted)', async () => {
    const student = makeStudent();

    mockGetFullList
      .mockResolvedValueOnce([student])
      .mockResolvedValueOnce([]); // Kein Progress

    // Wir brauchen eine Spalte — also fügen wir einen zweiten Schüler mit Progress hinzu
    // um einen Column-Key zu erzeugen
    const otherStudent = makeStudent({ id: 'stu-2', username: 'bert' });
    const prog = makeProgress({ user_id: 'stu-2' });

    mockGetFullList.mockReset();
    mockGetFullList
      .mockResolvedValueOnce([student, otherStudent])
      .mockResolvedValueOnce([prog]);

    const { result } = renderHook(() => useClassProgress('cls-1', 'ap1'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const key = 'lektion-1::aufgabe-1';
    // anna (stu-1) hat keinen Progress — suspicious sollte false sein
    const annaRow = result.current.rows.find((r) => r.student.username === 'anna');
    expect(annaRow?.cells.get(key)?.suspicious).toBe(false);
  });

  it('REQ-037: Manifest für anderen Kurs wird ignoriert (Fallback)', async () => {
    const student = makeStudent();
    const wrongCourseManifest: CourseManifest = {
      version: 1,
      course: 'pandas', // Anderer Kurs!
      name: 'Pandas',
      generatedAt: '2026-02-19T00:00:00.000Z',
      totalExercises: 5,
      modules: [],
    };
    const prog = makeProgress({ exercise: 'aufgabe-1', lesson: 'lektion-1' });

    mockGetFullList
      .mockResolvedValueOnce([student])
      .mockResolvedValueOnce([prog]);

    // course='ap1' aber manifest für 'pandas' — Fallback auf Progress-Records
    const { result } = renderHook(() => useClassProgress('cls-1', 'ap1', wrongCourseManifest), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.columns).toHaveLength(1);
    expect(result.current.columns[0].label).toBe('lektion-1/aufgabe-1'); // Fallback-Label
  });
});
