// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomePage from './HomePage';
import { getActiveSites } from '../config/sites';

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('HomePage', () => {
  it('zeigt die Hauptüberschrift', () => {
    renderWithRouter(<HomePage />);
    expect(screen.getByRole('heading', { name: 'Lernplattform', level: 1 })).toBeInTheDocument();
  });

  it('zeigt alle 6 Kurs-Kacheln als Links plus Footer-Link', () => {
    renderWithRouter(<HomePage />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(7); // 6 courses + Datenschutzerklärung
  });

  it('zeigt Datenschutzerklärung-Link im Footer', () => {
    renderWithRouter(<HomePage />);
    const link = screen.getByRole('link', { name: /Datenschutzerklärung/i });
    expect(link).toHaveAttribute('href', '/datenschutz');
  });

  it('verlinkt AP1-Trainer korrekt', () => {
    renderWithRouter(<HomePage />);
    const link = screen.getByRole('link', { name: /AP1-Trainer/i });
    expect(link).toHaveAttribute('href', '/ap1/');
  });

  it('verlinkt Pandas korrekt', () => {
    renderWithRouter(<HomePage />);
    const link = screen.getByRole('link', { name: /Pandas/i });
    expect(link).toHaveAttribute('href', '/pandas/');
  });

  it('hat einen main-Bereich', () => {
    renderWithRouter(<HomePage />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('zeigt Icons (SVG) für jede Kachel', () => {
    const { container } = renderWithRouter(<HomePage />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(6);
  });

  it('Kacheln stammen aus der Konfigurationsdatei', () => {
    renderWithRouter(<HomePage />);
    const activeSites = getActiveSites();
    for (const site of activeSites) {
      expect(screen.getByRole('link', { name: new RegExp(site.name, 'i') })).toHaveAttribute(
        'href',
        site.basePath
      );
    }
  });
});
