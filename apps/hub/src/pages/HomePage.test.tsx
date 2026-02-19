// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '@lernplattform/shared';
import type { AuthContextValue } from '@lernplattform/shared';
import HomePage from './HomePage';
import { getActiveSites } from '../config/sites';

const mockGetFullList = vi.fn().mockResolvedValue([]);

function makeAuthContext(isLoggedIn = false): AuthContextValue {
  return {
    isLoggedIn,
    user: isLoggedIn
      ? { id: 'u1', username: 'schüler', email: '', role: 'student', classId: null, displayName: '', verified: true }
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

function renderWithRouter(isLoggedIn = false) {
  return render(
    <AuthContext.Provider value={makeAuthContext(isLoggedIn)}>
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('HomePage', () => {
  it('zeigt die Hauptüberschrift', () => {
    renderWithRouter();
    expect(screen.getByRole('heading', { name: 'Lernplattform', level: 1 })).toBeInTheDocument();
  });

  it('zeigt alle 6 Kurs-Kacheln als Links plus Footer-Link und Gast-CTA-Links', () => {
    renderWithRouter();
    const links = screen.getAllByRole('link');
    // 6 courses + Datenschutzerklärung + Anmelden + Registrieren (Gast-CTA)
    expect(links).toHaveLength(9);
  });

  it('zeigt Datenschutzerklärung-Link im Footer', () => {
    renderWithRouter();
    const link = screen.getByRole('link', { name: /Datenschutzerklärung/i });
    expect(link).toHaveAttribute('href', '/datenschutz');
  });

  it('verlinkt AP1-Trainer korrekt', () => {
    renderWithRouter();
    const link = screen.getByRole('link', { name: /AP1-Trainer/i });
    expect(link.getAttribute('href')).toContain('/ap1/');
  });

  it('verlinkt Pandas korrekt', () => {
    renderWithRouter();
    const link = screen.getByRole('link', { name: /Pandas/i });
    expect(link.getAttribute('href')).toContain('/pandas/');
  });

  it('hat einen main-Bereich', () => {
    renderWithRouter();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('zeigt Icons (SVG) für jede Kachel', () => {
    const { container } = renderWithRouter();
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(6);
  });

  it('Kacheln stammen aus der Konfigurationsdatei', () => {
    renderWithRouter();
    const activeSites = getActiveSites();
    for (const site of activeSites) {
      const link = screen.getByRole('link', { name: new RegExp(site.name, 'i') });
      expect(link.getAttribute('href')).toContain(site.basePath);
    }
  });

  it('zeigt keine Fortschrittsbalken im Gast-Modus', () => {
    const { container } = renderWithRouter(false);
    expect(container.querySelector('[role="progressbar"]')).not.toBeInTheDocument();
  });
});
