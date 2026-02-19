import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '@lernplattform/shared';
import type { AuthContextValue } from '@lernplattform/shared';
import DashboardPage from './DashboardPage';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockGetFullList = vi.fn();
const mockGetOne = vi.fn();

function makeAuthContext(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
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
        getOne: mockGetOne,
        create: vi.fn(),
      }),
    } as unknown as AuthContextValue['pb'],
    ...overrides,
  };
}

function renderDashboard(path = '/klassen', authCtx: AuthContextValue = makeAuthContext()) {
  return render(
    <AuthContext.Provider value={authCtx}>
      <MemoryRouter initialEntries={[path]}>
        <DashboardPage />
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DashboardPage', () => {
  beforeEach(() => {
    mockGetFullList.mockReset();
    mockGetOne.mockReset();
    // Default: empty class list
    mockGetFullList.mockResolvedValue([]);
  });

  it('zeigt Lehrer-Dashboard Überschrift', () => {
    renderDashboard();
    expect(
      screen.getByRole('heading', { name: 'Lehrer-Dashboard', level: 1 })
    ).toBeInTheDocument();
  });

  it('zeigt Dashboard-Navigation', () => {
    renderDashboard();
    const nav = screen.getByRole('navigation', { name: 'Dashboard-Navigation' });
    expect(nav).toBeInTheDocument();
  });

  it('zeigt Klassen-Link in Navigation', () => {
    renderDashboard();
    expect(screen.getByRole('link', { name: 'Klassen' })).toBeInTheDocument();
  });

  it('zeigt Matrix-Link in Navigation', () => {
    renderDashboard();
    expect(screen.getByRole('link', { name: 'Matrix' })).toBeInTheDocument();
  });

  it('zeigt Freischaltung-Link in Navigation', () => {
    renderDashboard();
    expect(screen.getByRole('link', { name: 'Freischaltung' })).toBeInTheDocument();
  });

  it('zeigt Klassen-Heading auf Route /klassen', async () => {
    renderDashboard('/klassen');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Klassen', level: 2 })).toBeInTheDocument();
    });
  });

  it('hat ein main-Element für den Hauptinhalt', () => {
    renderDashboard();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('zeigt leere Klassen-Liste wenn keine Klassen vorhanden', async () => {
    renderDashboard('/klassen');
    await waitFor(() => {
      expect(screen.getByText(/Noch keine Klassen angelegt/i)).toBeInTheDocument();
    });
  });

  it('zeigt Detail-View auf Route /klassen/:id', async () => {
    mockGetOne.mockResolvedValueOnce({
      id: 'cls-1', name: 'FI24a', join_code: 'ABCDEF', school_year: '2025/2026', is_active: true, created_by: 'teacher-1',
    });
    mockGetFullList.mockResolvedValueOnce([]);

    renderDashboard('/klassen/cls-1');

    await waitFor(() => {
      expect(screen.getByText('FI24a')).toBeInTheDocument();
      expect(screen.getByText('ABCDEF')).toBeInTheDocument();
    });
  });
});
