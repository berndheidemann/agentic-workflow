// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '@lernplattform/shared';
import type { AuthContextValue } from '@lernplattform/shared';
import { ProfileSection } from './profile-section';

function makeAuthContext(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    isLoggedIn: false,
    user: null,
    token: null,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    pb: {} as AuthContextValue['pb'],
    ...overrides,
  };
}

const loggedInUser: AuthContextValue['user'] = {
  id: 'user1',
  username: 'testuser',
  email: 'test@example.com',
  role: 'student',
  classId: 'class1',
  displayName: 'testuser',
  verified: true,
};

function renderProfileSection(
  authCtx: AuthContextValue,
  totalCompleted = 30,
  totalExercises = 100
) {
  return render(
    <AuthContext.Provider value={authCtx}>
      <MemoryRouter>
        <ProfileSection totalCompleted={totalCompleted} totalExercises={totalExercises} />
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('ProfileSection', () => {
  it('zeigt Gast-CTA mit Anmelden/Registrieren-Links wenn nicht eingeloggt', () => {
    renderProfileSection(makeAuthContext());
    expect(screen.getByText(/Melde dich an/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Anmelden' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Registrieren' })).toHaveAttribute('href', '/register');
  });

  it('Gast-CTA hat aria-label="Anmeldung"', () => {
    renderProfileSection(makeAuthContext());
    const aside = screen.getByRole('complementary', { name: 'Anmeldung' });
    expect(aside).toBeInTheDocument();
  });

  it('rendert Begrüßung mit Username wenn eingeloggt', () => {
    renderProfileSection(makeAuthContext({ isLoggedIn: true, user: loggedInUser }));
    expect(screen.getByText(/Hallo testuser/)).toBeInTheDocument();
  });

  it('zeigt korrekte Fortschrittsangabe', () => {
    renderProfileSection(
      makeAuthContext({ isLoggedIn: true, user: loggedInUser }),
      42,
      280
    );
    expect(screen.getByText(/42 von 280 Aufgaben geschafft/)).toBeInTheDocument();
  });

  it('rendert Logout-Button', () => {
    renderProfileSection(makeAuthContext({ isLoggedIn: true, user: loggedInUser }));
    expect(screen.getByRole('button', { name: /abmelden/i })).toBeInTheDocument();
  });

  it('ruft logout auf wenn Logout-Button geklickt wird', () => {
    const logout = vi.fn();
    renderProfileSection(makeAuthContext({ isLoggedIn: true, user: loggedInUser, logout }));
    fireEvent.click(screen.getByRole('button', { name: /abmelden/i }));
    expect(logout).toHaveBeenCalledOnce();
  });

  it('hat aria-label="Profil" auf dem aside-Element wenn eingeloggt', () => {
    renderProfileSection(makeAuthContext({ isLoggedIn: true, user: loggedInUser }));
    const aside = screen.getByRole('complementary', { name: 'Profil' });
    expect(aside).toBeInTheDocument();
  });

  it('zeigt 0 von 0 wenn noch keine Aufgaben vorhanden', () => {
    renderProfileSection(makeAuthContext({ isLoggedIn: true, user: loggedInUser }), 0, 0);
    expect(screen.getByText(/0 von 0 Aufgaben geschafft/)).toBeInTheDocument();
  });
});
