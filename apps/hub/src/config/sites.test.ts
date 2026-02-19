import { describe, it, expect } from 'vitest';
import { sites, getActiveSites } from './sites';

describe('sites config', () => {
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
