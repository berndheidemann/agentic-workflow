// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { AuthContext } from '@lernplattform/shared';
import type { AuthContextValue } from '@lernplattform/shared';
import { useManifests } from './use-manifests';
import type { SiteConfig } from '../config/sites';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeAuthContext(): AuthContextValue {
  return {
    isLoggedIn: false,
    user: null,
    token: null,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    pb: {} as AuthContextValue['pb'],
  };
}

const makeSite = (slug: string, basePath = `/${slug}/`): SiteConfig => ({
  slug,
  name: `Kurs ${slug}`,
  description: '',
  icon: '',
  basePath,
  frameworkType: 'starlight',
  isActive: true,
  sortOrder: 1,
  totalExercises: 100,
  modules: [],
});

const validManifest = {
  version: 1,
  course: 'ap1',
  name: 'AP1-Trainer',
  generatedAt: '2026-02-19T00:00:00.000Z',
  modules: [],
  totalExercises: 42,
};

function makeFetchResponse(data: unknown) {
  return {
    ok: true,
    json: vi.fn().mockResolvedValue(data),
  };
}

function renderManifests(sites: SiteConfig[]) {
  const authCtx = makeAuthContext();
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    createElement(AuthContext.Provider, { value: authCtx }, children);
  return renderHook(() => useManifests(sites), { wrapper });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useManifests', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('leere Sites: keine Fetches, leere Map', async () => {
    const { result } = renderManifests([]);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.manifests.size).toBe(0);
  });

  it('erfolgreiches Laden: Manifest in Map gespeichert', async () => {
    fetchMock.mockResolvedValue(makeFetchResponse(validManifest));
    const sites = [makeSite('ap1')];
    const { result } = renderManifests(sites);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    // Wait for manifests to be populated (isLoading=false after successful fetch)
    await waitFor(() => expect(result.current.manifests.size).toBe(1));

    expect(result.current.manifests.get('ap1')?.totalExercises).toBe(42);
  });

  it('HTTP-Fehler: Site wird aus Map ausgeschlossen', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404 });
    const sites = [makeSite('ap1')];
    const { result } = renderManifests(sites);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.manifests.size).toBe(0);
  });

  it('Netzwerkfehler: Site wird aus Map ausgeschlossen', async () => {
    fetchMock.mockRejectedValue(new Error('Network error'));
    const sites = [makeSite('ap1')];
    const { result } = renderManifests(sites);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.manifests.size).toBe(0);
  });

  it('ungültiges JSON-Schema: Site wird aus Map ausgeschlossen', async () => {
    fetchMock.mockResolvedValue(makeFetchResponse({ version: 99, invalid: true }));
    const sites = [makeSite('ap1')];
    const { result } = renderManifests(sites);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.manifests.size).toBe(0);
  });

  it('mehrere Sites parallel: alle erfolgreichen Manifeste in Map', async () => {
    fetchMock
      .mockResolvedValueOnce(makeFetchResponse({ ...validManifest, course: 'ap1', totalExercises: 10 }))
      .mockResolvedValueOnce({ ok: false }) // pandas schlägt fehl
      .mockResolvedValueOnce(makeFetchResponse({ ...validManifest, course: 'rest', totalExercises: 20 }));
    const sites = [makeSite('ap1'), makeSite('pandas'), makeSite('rest')];
    const { result } = renderManifests(sites);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await waitFor(() => expect(result.current.manifests.size).toBe(2));

    expect(result.current.manifests.has('ap1')).toBe(true);
    expect(result.current.manifests.has('pandas')).toBe(false);
    expect(result.current.manifests.has('rest')).toBe(true);
  });

  it('getManifest gibt korrektes Manifest zurück', async () => {
    fetchMock.mockResolvedValue(makeFetchResponse(validManifest));
    const sites = [makeSite('ap1')];
    const { result } = renderManifests(sites);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await waitFor(() => expect(result.current.manifests.size).toBe(1));

    expect(result.current.getManifest('ap1')?.course).toBe('ap1');
    expect(result.current.getManifest('unbekannt')).toBeNull();
  });

  it('fetcht von basePath/course-manifest.json', async () => {
    fetchMock.mockResolvedValue({ ok: false });
    const site = makeSite('ap1', '/ap1/');
    renderManifests([site]);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    expect(fetchMock).toHaveBeenCalledWith('/ap1/course-manifest.json');
  });
});
