// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '@lernplattform/shared';
import type { AuthContextValue } from '@lernplattform/shared';
import HomePage from './HomePage';
import { getActiveSites } from '../config/sites';

const mockGetFullList = vi.fn().mockResolvedValue([]);

function makeAuthContext(
  isLoggedIn = false,
  role: 'student' | 'teacher' = 'student',
  classId: string | null = null,
): AuthContextValue {
  return {
    isLoggedIn,
    user: isLoggedIn
      ? { id: 'u1', username: 'schüler', email: '', role, classId, displayName: '', verified: true }
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

function renderWithRouter(
  isLoggedIn = false,
  role: 'student' | 'teacher' = 'student',
  classId: string | null = null,
) {
  return render(
    <AuthContext.Provider value={makeAuthContext(isLoggedIn, role, classId)}>
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('HomePage', () => {
  beforeEach(() => {
    mockGetFullList.mockReset();
    mockGetFullList.mockResolvedValue([]);
  });

  it('zeigt die Hauptüberschrift', () => {
    renderWithRouter();
    expect(screen.getByRole('heading', { name: 'Lernplattform', level: 1 })).toBeInTheDocument();
  });

  it('zeigt alle 6 Kurs-Kacheln als Links plus Footer-Link und Gast-CTA-Links', () => {
    renderWithRouter();
    const links = screen.getAllByRole('link');
    // 6 courses + Datenschutzerklärung + Anmelden + Registrieren (Gast-CTA) + Melde dich an (LoginBanner)
    expect(links).toHaveLength(10);
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

  it('zeigt LoginBanner im Gast-Modus', () => {
    renderWithRouter(false);
    expect(screen.getByRole('complementary', { name: 'Anmelde-Hinweis' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Melde dich an/i })).toBeInTheDocument();
  });

  it('zeigt keinen LoginBanner wenn eingeloggt', () => {
    renderWithRouter(true);
    expect(screen.queryByRole('complementary', { name: 'Anmelde-Hinweis' })).not.toBeInTheDocument();
  });

  // ─── Kurs-Filterung nach Klassen-Zuordnung ──────────────────────────────────

  it('zeigt alle 6 Kurse im Gast-Modus (kein API-Call)', () => {
    renderWithRouter(false);
    const activeSites = getActiveSites();
    for (const site of activeSites) {
      expect(screen.getByRole('link', { name: new RegExp(site.name, 'i') })).toBeInTheDocument();
    }
    expect(mockGetFullList).not.toHaveBeenCalled();
  });

  it('zeigt alle 6 Kurse für Lehrer (sieht immer alle Kurse)', () => {
    renderWithRouter(true, 'teacher', 'class-123');
    const activeSites = getActiveSites();
    for (const site of activeSites) {
      expect(screen.getByRole('link', { name: new RegExp(site.name, 'i') })).toBeInTheDocument();
    }
  });

  it('zeigt alle 6 Kurse für Schüler ohne Klasse (classId=null)', () => {
    renderWithRouter(true, 'student', null);
    const activeSites = getActiveSites();
    for (const site of activeSites) {
      expect(screen.getByRole('link', { name: new RegExp(site.name, 'i') })).toBeInTheDocument();
    }
  });

  it('zeigt alle 6 Kurse wenn keine Unlock-Records für die Klasse existieren (Default-offen)', async () => {
    mockGetFullList.mockResolvedValue([]); // no records → default-open
    renderWithRouter(true, 'student', 'class-123');
    await waitFor(() => expect(mockGetFullList).toHaveBeenCalled());
    const activeSites = getActiveSites();
    for (const site of activeSites) {
      expect(screen.getByRole('link', { name: new RegExp(site.name, 'i') })).toBeInTheDocument();
    }
  });

  it('zeigt nur freigeschaltete Kurse für Schüler mit Klasse und Records', async () => {
    mockGetFullList.mockResolvedValue([
      { course: 'ap1' },
      { course: 'pandas' },
      { course: 'zuul' },
    ]);
    renderWithRouter(true, 'student', 'class-123');
    await waitFor(() => expect(mockGetFullList).toHaveBeenCalled());

    // Visible courses
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /AP1-Trainer/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: /Pandas/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /World of Zuul/i })).toBeInTheDocument();

    // Hidden courses
    expect(screen.queryByRole('link', { name: /REST & NoSQL/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /NumPy/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /UML/i })).not.toBeInTheDocument();
  });
});
