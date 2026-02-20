// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { AuthContext } from '@lernplattform/shared';
import type { AuthContextValue, CourseManifest } from '@lernplattform/shared';
import { useCourseProgress } from './use-course-progress';
import type { SiteConfig } from '../config/sites';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockGetFullList = vi.fn();

function makeAuthContext(isLoggedIn: boolean, userId = 'user-1'): AuthContextValue {
  return {
    isLoggedIn,
    user: isLoggedIn
      ? { id: userId, username: 'test', email: '', role: 'student', classId: null, displayName: '', verified: true }
      : null,
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

const makeSite = (slug: string, totalExercises: number): SiteConfig => ({
  slug,
  name: `Kurs ${slug}`,
  description: `Beschreibung ${slug}`,
  icon: 'M12 12',
  basePath: `/${slug}/`,
  frameworkType: 'starlight',
  isActive: true,
  sortOrder: 1,
  totalExercises,
  modules: [],
});

function renderWithAuth(
  isLoggedIn: boolean,
  sites: SiteConfig[],
  manifests?: Map<string, CourseManifest>
) {
  const authCtx = makeAuthContext(isLoggedIn);
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    createElement(AuthContext.Provider, { value: authCtx }, children);
  return renderHook(() => useCourseProgress(sites, manifests), { wrapper });
}

function makeManifest(courseSlug: string, totalExercises: number): CourseManifest {
  return {
    version: 1,
    course: courseSlug,
    name: `Kurs ${courseSlug}`,
    generatedAt: '2026-02-19T00:00:00.000Z',
    modules: [],
    totalExercises,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useCourseProgress', () => {
  beforeEach(() => {
    mockGetFullList.mockReset();
  });

  it('Gast-Modus: gibt leere Map zurück, kein API-Call', () => {
    const sites = [makeSite('ap1', 120), makeSite('pandas', 40)];
    const { result } = renderWithAuth(false, sites);

    expect(result.current.progress.size).toBe(0);
    expect(result.current.isLoading).toBe(false);
    expect(mockGetFullList).not.toHaveBeenCalled();
  });

  it('eingeloggt, keine Progress-Daten: alle Kurse haben 0 completed', async () => {
    mockGetFullList.mockResolvedValue([]);
    const sites = [makeSite('ap1', 120), makeSite('pandas', 40)];
    const { result } = renderWithAuth(true, sites);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.progress.get('ap1')?.completedExercises).toBe(0);
    expect(result.current.progress.get('ap1')?.percentage).toBe(0);
    expect(result.current.progress.get('pandas')?.completedExercises).toBe(0);
  });

  it('eingeloggt, gemischte Progress-Daten: korrekte Zuordnung zu Kursen', async () => {
    mockGetFullList.mockResolvedValue([
      { course: 'ap1', lesson: 'lf1/aufgabe-1' },
      { course: 'ap1', lesson: 'lf1/aufgabe-2' },
      { course: 'pandas', lesson: 'grundlagen/aufgabe-1' },
    ]);
    const sites = [makeSite('ap1', 120), makeSite('pandas', 40)];
    const { result } = renderWithAuth(true, sites);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.progress.get('ap1')?.completedExercises).toBe(2);
    expect(result.current.progress.get('pandas')?.completedExercises).toBe(1);
  });

  it('doppelte lesson-Einträge werden nur einmal gezählt', async () => {
    mockGetFullList.mockResolvedValue([
      { course: 'ap1', lesson: 'lf1/aufgabe-1' },
      { course: 'ap1', lesson: 'lf1/aufgabe-1' }, // Duplikat
    ]);
    const sites = [makeSite('ap1', 120)];
    const { result } = renderWithAuth(true, sites);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.progress.get('ap1')?.completedExercises).toBe(1);
  });

  it('korrekte Prozent-Berechnung (3/7 = 43%)', async () => {
    mockGetFullList.mockResolvedValue([
      { course: 'zuul', lesson: 'a' },
      { course: 'zuul', lesson: 'b' },
      { course: 'zuul', lesson: 'c' },
    ]);
    const sites = [makeSite('zuul', 7)];
    const { result } = renderWithAuth(true, sites);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.progress.get('zuul')?.percentage).toBe(43);
  });

  it('isLoading ist true während des Fetches', async () => {
    let resolveFetch!: (v: unknown[]) => void;
    mockGetFullList.mockReturnValue(new Promise((res) => (resolveFetch = res)));
    const sites = [makeSite('ap1', 120)];
    const { result } = renderWithAuth(true, sites);

    expect(result.current.isLoading).toBe(true);

    resolveFetch([]);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it('bei fetch-Fehler: leere Map zurückgeben, isLoading false', async () => {
    mockGetFullList.mockRejectedValue(new Error('Network error'));
    const sites = [makeSite('ap1', 120)];
    const { result } = renderWithAuth(true, sites);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.progress.size).toBe(0);
  });

  it('Kurs ohne Eintrag in Progress-Daten hat 0 completed', async () => {
    mockGetFullList.mockResolvedValue([{ course: 'pandas', lesson: 'grundlagen/a' }]);
    const sites = [makeSite('ap1', 120), makeSite('pandas', 40)];
    const { result } = renderWithAuth(true, sites);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.progress.get('ap1')?.completedExercises).toBe(0);
    expect(result.current.progress.get('pandas')?.completedExercises).toBe(1);
  });

  it('REQ-037: Manifest-totalExercises überschreibt sites.json-Wert', async () => {
    mockGetFullList.mockResolvedValue([{ course: 'ap1', lesson: 'netzwerktechnik/lektion-1' }]);
    const sites = [makeSite('ap1', 120)]; // sites.json sagt 120
    const manifests = new Map([['ap1', makeManifest('ap1', 236)]]); // Manifest sagt 236
    const { result } = renderWithAuth(true, sites, manifests);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.progress.get('ap1')?.totalExercises).toBe(236);
    expect(result.current.progress.get('ap1')?.completedExercises).toBe(1);
    expect(result.current.progress.get('ap1')?.percentage).toBe(0); // 1/236 < 0.5% → rounds to 0
  });

  it('REQ-037: Fallback auf sites.json wenn kein Manifest', async () => {
    mockGetFullList.mockResolvedValue([{ course: 'ap1', lesson: 'netzwerktechnik/lektion-1' }]);
    const sites = [makeSite('ap1', 120)];
    const { result } = renderWithAuth(true, sites); // kein manifests-Parameter

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.progress.get('ap1')?.totalExercises).toBe(120);
  });

  it('REQ-037: Manifest nur für bekannte Kurse — andere Kurse nutzen Fallback', async () => {
    mockGetFullList.mockResolvedValue([]);
    const sites = [makeSite('ap1', 120), makeSite('pandas', 40)];
    const manifests = new Map([['ap1', makeManifest('ap1', 236)]]); // nur ap1 hat Manifest
    const { result } = renderWithAuth(true, sites, manifests);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.progress.get('ap1')?.totalExercises).toBe(236);
    expect(result.current.progress.get('pandas')?.totalExercises).toBe(40); // Fallback
  });
});
