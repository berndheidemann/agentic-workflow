import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import LoginPage from './LoginPage';
import { AuthContext } from '@lernplattform/shared';
import type { AuthContextValue } from '@lernplattform/shared';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function makeAuthContext(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    isLoggedIn: false,
    user: null,
    token: null,
    isLoading: false,
    login: vi.fn().mockResolvedValue(undefined),
    register: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn(),
    pb: {} as AuthContextValue['pb'],
    ...overrides,
  };
}

function renderLoginPage(authCtx: AuthContextValue = makeAuthContext()) {
  return render(
    <AuthContext.Provider value={authCtx}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

function getForm() {
  return screen.getByRole('button', { name: /anmelden/i }).closest('form')!;
}

function fillForm(classCode = 'AB3C4D', username = 'testuser', pin = '1234') {
  fireEvent.change(screen.getByLabelText('Klassen-Code'), { target: { value: classCode } });
  fireEvent.change(screen.getByLabelText('Benutzername'), { target: { value: username } });
  fireEvent.change(screen.getByLabelText('PIN (4 Ziffern)'), { target: { value: pin } });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  it('zeigt die Login-Überschrift', () => {
    renderLoginPage();
    expect(screen.getByRole('heading', { name: 'Anmelden', level: 1 })).toBeInTheDocument();
  });

  it('hat einen main-Bereich', () => {
    renderLoginPage();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('zeigt Klassen-Code-Feld', () => {
    renderLoginPage();
    expect(screen.getByLabelText('Klassen-Code')).toBeInTheDocument();
  });

  it('zeigt Benutzername-Feld', () => {
    renderLoginPage();
    expect(screen.getByLabelText('Benutzername')).toBeInTheDocument();
  });

  it('zeigt PIN-Feld', () => {
    renderLoginPage();
    expect(screen.getByLabelText('PIN (4 Ziffern)')).toBeInTheDocument();
  });

  it('zeigt Anmelden-Button', () => {
    renderLoginPage();
    expect(screen.getByRole('button', { name: 'Anmelden' })).toBeInTheDocument();
  });

  it('enthält Link zur Registrierungsseite', () => {
    renderLoginPage();
    expect(screen.getByRole('link', { name: /registrieren/i })).toBeInTheDocument();
  });

  // ── Validierung ───────────────────────────────────────────────────────────

  it('zeigt Fehler bei leerem Klassen-Code nach Submit', async () => {
    renderLoginPage();
    fireEvent.submit(getForm());
    expect(await screen.findByText('Bitte Klassen-Code eingeben.')).toBeInTheDocument();
  });

  it('zeigt Fehler bei ungültigem Klassen-Code (zu kurz)', async () => {
    renderLoginPage();
    fireEvent.change(screen.getByLabelText('Klassen-Code'), { target: { value: 'ABC' } });
    fireEvent.submit(getForm());
    expect(
      await screen.findByText('Klassen-Code muss aus 6 Zeichen bestehen (Buchstaben und Ziffern).')
    ).toBeInTheDocument();
  });

  it('zeigt Fehler bei leerem Benutzernamen nach Submit', async () => {
    renderLoginPage();
    fireEvent.change(screen.getByLabelText('Klassen-Code'), { target: { value: 'AB3C4D' } });
    fireEvent.submit(getForm());
    expect(await screen.findByText('Bitte Benutzernamen eingeben.')).toBeInTheDocument();
  });

  it('zeigt Fehler bei leerem PIN nach Submit', async () => {
    renderLoginPage();
    fireEvent.change(screen.getByLabelText('Klassen-Code'), { target: { value: 'AB3C4D' } });
    fireEvent.change(screen.getByLabelText('Benutzername'), { target: { value: 'testuser' } });
    fireEvent.submit(getForm());
    expect(await screen.findByText('Bitte PIN eingeben.')).toBeInTheDocument();
  });

  it('zeigt Fehler bei ungültigem PIN (nicht 4 Ziffern)', async () => {
    renderLoginPage();
    fillForm('AB3C4D', 'testuser', '12');
    fireEvent.submit(getForm());
    expect(await screen.findByText('PIN muss aus genau 4 Ziffern bestehen.')).toBeInTheDocument();
  });

  it('zeigt Fehler bei nicht-numerischem PIN', async () => {
    renderLoginPage();
    fillForm('AB3C4D', 'testuser', 'abcd');
    fireEvent.submit(getForm());
    expect(await screen.findByText('PIN muss aus genau 4 Ziffern bestehen.')).toBeInTheDocument();
  });

  // ── Submit-Verhalten ──────────────────────────────────────────────────────

  it('ruft login() mit username und pin auf — nicht mit classCode', async () => {
    const mockLogin = vi.fn().mockResolvedValue(undefined);
    renderLoginPage(makeAuthContext({ login: mockLogin }));

    fillForm();
    fireEvent.submit(getForm());

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', '1234');
    });
  });

  it('übergibt keinen Klassen-Code an login()', async () => {
    const mockLogin = vi.fn().mockResolvedValue(undefined);
    renderLoginPage(makeAuthContext({ login: mockLogin }));

    fillForm();
    fireEvent.submit(getForm());

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledTimes(1);
      expect(mockLogin.mock.calls[0]).toHaveLength(2);
    });
  });

  it('navigiert auf "/" nach erfolgreichem Login', async () => {
    const mockLogin = vi.fn().mockResolvedValue(undefined);
    renderLoginPage(makeAuthContext({ login: mockLogin }));

    fillForm();
    fireEvent.submit(getForm());

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('zeigt Lade-Zustand während Submit (Button disabled)', async () => {
    let resolveLogin!: () => void;
    const mockLogin = vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveLogin = resolve;
        })
    );
    renderLoginPage(makeAuthContext({ login: mockLogin }));

    fillForm();
    fireEvent.submit(getForm());

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Wird angemeldet…' })).toBeDisabled();
    });

    act(() => {
      resolveLogin();
    });
  });

  it('zeigt Server-Fehlermeldung bei Status 400 (falscher Login)', async () => {
    const mockLogin = vi.fn().mockRejectedValue({ status: 400 });
    renderLoginPage(makeAuthContext({ login: mockLogin }));

    fillForm();
    fireEvent.submit(getForm());

    expect(await screen.findByText('Benutzername oder PIN ist falsch.')).toBeInTheDocument();
  });

  it('zeigt Netzwerk-Fehlermeldung bei Status 0', async () => {
    const mockLogin = vi.fn().mockRejectedValue({ status: 0 });
    renderLoginPage(makeAuthContext({ login: mockLogin }));

    fillForm();
    fireEvent.submit(getForm());

    expect(
      await screen.findByText('Verbindung zum Server fehlgeschlagen. Bitte versuche es erneut.')
    ).toBeInTheDocument();
  });

  it('Button ist nach fehlgeschlagenem Login wieder aktiv', async () => {
    const mockLogin = vi.fn().mockRejectedValue({ status: 400 });
    renderLoginPage(makeAuthContext({ login: mockLogin }));

    fillForm();
    fireEvent.submit(getForm());

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Anmelden' })).not.toBeDisabled();
    });
  });

  it('Klassen-Code-Eingabe wird automatisch großgeschrieben', () => {
    renderLoginPage();
    const input = screen.getByLabelText('Klassen-Code');
    fireEvent.change(input, { target: { value: 'ab3c4d' } });
    expect(input).toHaveValue('AB3C4D');
  });

  // ── Accessibility ─────────────────────────────────────────────────────────

  it('Felder haben aria-invalid="true" bei Validierungsfehler', async () => {
    renderLoginPage();
    fireEvent.submit(getForm());

    await waitFor(() => {
      expect(screen.getByLabelText('Klassen-Code')).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByLabelText('Benutzername')).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByLabelText('PIN (4 Ziffern)')).toHaveAttribute('aria-invalid', 'true');
    });
  });

  it('Felder haben aria-describedby bei Fehlern', async () => {
    renderLoginPage();
    fireEvent.submit(getForm());

    await waitFor(() => {
      expect(screen.getByLabelText('Klassen-Code')).toHaveAttribute(
        'aria-describedby',
        'classCode-error'
      );
      expect(screen.getByLabelText('Benutzername')).toHaveAttribute(
        'aria-describedby',
        'username-error'
      );
      expect(screen.getByLabelText('PIN (4 Ziffern)')).toHaveAttribute(
        'aria-describedby',
        'pin-error'
      );
    });
  });

  it('alle Felder haben aria-required="true"', () => {
    renderLoginPage();
    expect(screen.getByLabelText('Klassen-Code')).toHaveAttribute('aria-required', 'true');
    expect(screen.getByLabelText('Benutzername')).toHaveAttribute('aria-required', 'true');
    expect(screen.getByLabelText('PIN (4 Ziffern)')).toHaveAttribute('aria-required', 'true');
  });

  it('Server-Fehler-Container hat role="alert"', async () => {
    const mockLogin = vi.fn().mockRejectedValue({ status: 400 });
    renderLoginPage(makeAuthContext({ login: mockLogin }));

    fillForm();
    fireEvent.submit(getForm());

    await waitFor(() => {
      expect(screen.getByText('Benutzername oder PIN ist falsch.')).toBeInTheDocument();
    });
    const alerts = screen.getAllByRole('alert');
    expect(alerts.length).toBeGreaterThan(0);
  });
});
