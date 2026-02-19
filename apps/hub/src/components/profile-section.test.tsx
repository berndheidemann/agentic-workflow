// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
      <ProfileSection totalCompleted={totalCompleted} totalExercises={totalExercises} />
    </AuthContext.Provider>
  );
}

describe('ProfileSection', () => {
  it('rendert nichts wenn nicht eingeloggt', () => {
    const { container } = renderProfileSection(makeAuthContext());
    expect(container.firstChild).toBeNull();
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

  it('hat aria-label="Profil" auf dem aside-Element', () => {
    const { container } = renderProfileSection(
      makeAuthContext({ isLoggedIn: true, user: loggedInUser })
    );
    const aside = container.querySelector('aside');
    expect(aside).toHaveAttribute('aria-label', 'Profil');
  });

  it('zeigt 0 von 0 wenn noch keine Aufgaben vorhanden', () => {
    renderProfileSection(makeAuthContext({ isLoggedIn: true, user: loggedInUser }), 0, 0);
    expect(screen.getByText(/0 von 0 Aufgaben geschafft/)).toBeInTheDocument();
  });
});
