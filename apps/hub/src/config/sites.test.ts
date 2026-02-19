// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { sites, getActiveSites, getSites, useSites } from './sites';

describe('sites static config', () => {
  it('enthält genau 6 Sites', () => {
    expect(sites).toHaveLength(6);
  });

  it('jede Site hat alle Pflichtfelder', () => {
    for (const site of sites) {
      expect(site.slug).toBeTruthy();
      expect(site.name).toBeTruthy();
      expect(site.description).toBeTruthy();
      expect(site.icon).toBeTruthy();
      expect(site.basePath).toBeTruthy();
      expect(site.frameworkType).toMatch(/^(starlight|react-spa)$/);
      expect(typeof site.isActive).toBe('boolean');
      expect(typeof site.sortOrder).toBe('number');
      expect(typeof site.totalExercises).toBe('number');
      expect(site.totalExercises).toBeGreaterThan(0);
      expect(Array.isArray(site.modules)).toBe(true);
      expect(site.modules.length).toBeGreaterThan(0);
    }
  });

  it('jedes Modul hat id, name und sortOrder', () => {
    for (const site of sites) {
      for (const mod of site.modules) {
        expect(mod.id).toBeTruthy();
        expect(mod.name).toBeTruthy();
        expect(typeof mod.sortOrder).toBe('number');
      }
    }
  });

  it('alle basePath-Werte enden mit /', () => {
    for (const site of sites) {
      expect(site.basePath).toMatch(/\/$/);
    }
  });

  it('alle slug-Werte sind eindeutig', () => {
    const slugs = sites.map((s) => s.slug);
    const unique = new Set(slugs);
    expect(unique.size).toBe(slugs.length);
  });

  it('getActiveSites gibt nur aktive Sites zurück', () => {
    const active = getActiveSites();
    expect(active.every((s) => s.isActive)).toBe(true);
  });

  it('getActiveSites gibt Sites sortiert nach sortOrder zurück', () => {
    const active = getActiveSites();
    for (let i = 1; i < active.length; i++) {
      expect(active[i].sortOrder).toBeGreaterThan(active[i - 1].sortOrder);
    }
  });

  it('getActiveSites enthält alle bekannten Sites', () => {
    const slugs = getActiveSites().map((s) => s.slug);
    expect(slugs).toContain('ap1');
    expect(slugs).toContain('pandas');
    expect(slugs).toContain('rest');
    expect(slugs).toContain('zuul');
    expect(slugs).toContain('numpy');
    expect(slugs).toContain('uml');
  });
});

describe('getSites (async, fetch from sites.json)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('liefert Sites aus sites.json (camelCase konvertiert)', async () => {
    const mockJson = {
      version: 1,
      sites: [
        {
          slug: 'test-site',
          name: 'Test Site',
          description: 'A test site',
          icon: 'M0 0',
          base_path: '/test/',
          framework_type: 'react-spa',
          is_active: true,
          sort_order: 1,
          modules: [{ id: 'mod1', name: 'Modul 1', sort_order: 1 }],
        },
      ],
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockJson),
      }),
    );

    const result = await getSites();
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('test-site');
    expect(result[0].basePath).toBe('/test/');
    expect(result[0].frameworkType).toBe('react-spa');
    expect(result[0].isActive).toBe(true);
    expect(result[0].sortOrder).toBe(1);
    expect(result[0].modules[0].sortOrder).toBe(1);
  });

  it('fällt auf statische Sites zurück wenn fetch fehlschlägt', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const result = await getSites();
    // Falls back to static array
    expect(result.length).toBeGreaterThan(0);
    expect(result.find((s) => s.slug === 'ap1')).toBeDefined();
  });

  it('fällt auf statische Sites zurück wenn HTTP-Status nicht ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      }),
    );

    const result = await getSites();
    expect(result.length).toBeGreaterThan(0);
    expect(result.find((s) => s.slug === 'ap1')).toBeDefined();
  });
});

describe('useSites Hook', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('startet mit statischen Sites (kein Loading-Flash)', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => new Promise(() => {})), // never resolves
    );

    const { result } = renderHook(() => useSites());
    // Initial render has static sites immediately
    expect(result.current.sites.length).toBeGreaterThan(0);
    expect(result.current.isLoading).toBe(true);
  });

  it('aktualisiert Sites nach erfolgreichem Fetch', async () => {
    const mockJson = {
      version: 1,
      sites: [
        {
          slug: 'from-json',
          name: 'From JSON',
          description: 'Loaded from registry',
          icon: 'M0 0',
          base_path: '/from-json/',
          framework_type: 'react-spa' as const,
          is_active: true,
          sort_order: 1,
          total_exercises: 10,
          modules: [],
        },
      ],
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockJson),
      }),
    );

    const { result } = renderHook(() => useSites());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.sites).toHaveLength(1);
    expect(result.current.sites[0].slug).toBe('from-json');
  });

  it('setzt isLoading auf false und behält Fallback-Sites bei Fetch-Fehler', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    const { result } = renderHook(() => useSites());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Fallback: static sites still present
    expect(result.current.sites.length).toBeGreaterThan(0);
  });
});
