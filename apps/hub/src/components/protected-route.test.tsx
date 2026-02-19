import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProtectedRoute } from './protected-route';

// Mock useAuth to control auth state in tests
vi.mock('@lernplattform/shared', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '@lernplattform/shared';

const mockUseAuth = vi.mocked(useAuth);

function renderWithRouter(ui: React.ReactElement, initialEntries = ['/dashboard']) {
  return render(<MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>);
}

describe('ProtectedRoute', () => {
  it('zeigt Lade-Indikator wenn isLoading', () => {
    mockUseAuth.mockReturnValue({
      isLoggedIn: false,
      isLoading: true,
      user: null,
      token: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      pb: {} as never,
    });

    renderWithRouter(
      <ProtectedRoute>
        <div>Geschützter Inhalt</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Laden…')).toBeInTheDocument();
    expect(screen.queryByText('Geschützter Inhalt')).not.toBeInTheDocument();
  });

  it('leitet auf /login weiter wenn nicht eingeloggt', () => {
    mockUseAuth.mockReturnValue({
      isLoggedIn: false,
      isLoading: false,
      user: null,
      token: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      pb: {} as never,
    });

    const { container } = renderWithRouter(
      <ProtectedRoute>
        <div>Geschützter Inhalt</div>
      </ProtectedRoute>
    );

    expect(screen.queryByText('Geschützter Inhalt')).not.toBeInTheDocument();
    // MemoryRouter should have navigated away (no content rendered)
    expect(container.textContent).toBe('');
  });

  it('zeigt Inhalt wenn eingeloggt ohne Rollenanforderung', () => {
    mockUseAuth.mockReturnValue({
      isLoggedIn: true,
      isLoading: false,
      user: {
        id: '1',
        username: 'lehrer1',
        email: '',
        role: 'teacher',
        classId: null,
        displayName: 'Lehrer',
        verified: true,
      },
      token: 'tok',
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      pb: {} as never,
    });

    renderWithRouter(
      <ProtectedRoute>
        <div>Geschützter Inhalt</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Geschützter Inhalt')).toBeInTheDocument();
  });

  it('zeigt Inhalt wenn Lehrer auf teacher-Route zugreift', () => {
    mockUseAuth.mockReturnValue({
      isLoggedIn: true,
      isLoading: false,
      user: {
        id: '1',
        username: 'lehrer1',
        email: '',
        role: 'teacher',
        classId: null,
        displayName: 'Lehrer',
        verified: true,
      },
      token: 'tok',
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      pb: {} as never,
    });

    renderWithRouter(
      <ProtectedRoute role="teacher">
        <div>Dashboard</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('leitet auf / weiter wenn Schüler auf teacher-Route zugreift', () => {
    mockUseAuth.mockReturnValue({
      isLoggedIn: true,
      isLoading: false,
      user: {
        id: '2',
        username: 'schueler1',
        email: '',
        role: 'student',
        classId: 'class1',
        displayName: 'Schüler',
        verified: true,
      },
      token: 'tok',
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      pb: {} as never,
    });

    const { container } = renderWithRouter(
      <ProtectedRoute role="teacher">
        <div>Dashboard</div>
      </ProtectedRoute>
    );

    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(container.textContent).toBe('');
  });

  it('Lade-Indikator hat aria-busy und aria-live', () => {
    mockUseAuth.mockReturnValue({
      isLoggedIn: false,
      isLoading: true,
      user: null,
      token: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      pb: {} as never,
    });

    const { container } = renderWithRouter(
      <ProtectedRoute>
        <div>Inhalt</div>
      </ProtectedRoute>
    );

    const loader = container.querySelector('[aria-busy="true"]');
    expect(loader).toBeInTheDocument();
    expect(loader).toHaveAttribute('aria-live', 'polite');
  });
});
