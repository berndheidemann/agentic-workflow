// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CourseGrid } from './course-grid';
import type { SiteConfig } from '../config/sites';

const makeSite = (slug: string, sortOrder: number): SiteConfig => ({
  slug,
  name: `Kurs ${slug}`,
  description: `Beschreibung ${slug}`,
  icon: 'M12 12',
  basePath: `/${slug}/`,
  frameworkType: 'starlight',
  isActive: true,
  sortOrder,
  modules: [],
});

describe('CourseGrid', () => {
  it('rendert eine CourseCard pro Site', () => {
    const sites = [makeSite('ap1', 1), makeSite('pandas', 2), makeSite('rest', 3)];
    render(<CourseGrid sites={sites} />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(3);
  });

  it('zeigt Leer-Meldung bei leerem Array', () => {
    render(<CourseGrid sites={[]} />);
    expect(screen.getByText('Keine Kurse verfügbar.')).toBeInTheDocument();
  });

  it('zeigt Lade-Meldung wenn isLoading=true und keine Sites vorhanden', () => {
    render(<CourseGrid sites={[]} isLoading={true} />);
    expect(screen.getByText('Kurse werden geladen…')).toBeInTheDocument();
  });

  it('zeigt Sites auch wenn isLoading=true (kein Loading-Flash bei Fallback)', () => {
    const sites = [makeSite('ap1', 1)];
    render(<CourseGrid sites={sites} isLoading={true} />);
    // Sites are visible even while loading (static fallback prevents flash)
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('rendert Kacheln in der übergebenen Reihenfolge', () => {
    const sites = [makeSite('ap1', 1), makeSite('pandas', 2)];
    render(<CourseGrid sites={sites} />);
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/ap1/');
    expect(links[1]).toHaveAttribute('href', '/pandas/');
  });
});
