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

  it('rendert Kacheln in der übergebenen Reihenfolge', () => {
    const sites = [makeSite('ap1', 1), makeSite('pandas', 2)];
    render(<CourseGrid sites={sites} />);
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/ap1/');
    expect(links[1]).toHaveAttribute('href', '/pandas/');
  });
});
