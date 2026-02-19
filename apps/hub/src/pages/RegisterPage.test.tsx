import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { axe } from 'vitest-axe';
import RegisterPage from './RegisterPage';
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

function renderRegisterPage(authCtx: AuthContextValue = makeAuthContext()) {
  return render(
    <AuthContext.Provider value={authCtx}>
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

function getForm() {
  return screen.getByRole('button', { name: /registrieren/i }).closest('form')!;
}

function fillForm(classCode = 'AB3C4D', username = 'testuser', pin = '1234') {
  fireEvent.change(screen.getByLabelText('Klassen-Code'), { target: { value: classCode } });
  fireEvent.change(screen.getByLabelText('Benutzername'), { target: { value: username } });
  fireEvent.change(screen.getByLabelText('PIN (4 Ziffern)'), { target: { value: pin } });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  it('zeigt die Registrierungs-Überschrift', () => {
    renderRegisterPage();
    expect(screen.getByRole('heading', { name: 'Registrieren', level: 1 })).toBeInTheDocument();
  });

  it('hat einen main-Bereich', () => {
    renderRegisterPage();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('zeigt Klassen-Code-Feld', () => {
    renderRegisterPage();
    expect(screen.getByLabelText('Klassen-Code')).toBeInTheDocument();
  });

  it('zeigt Benutzername-Feld', () => {
    renderRegisterPage();
    expect(screen.getByLabelText('Benutzername')).toBeInTheDocument();
  });

  it('zeigt PIN-Feld', () => {
    renderRegisterPage();
    expect(screen.getByLabelText('PIN (4 Ziffern)')).toBeInTheDocument();
  });

  it('zeigt Registrieren-Button', () => {
    renderRegisterPage();
    expect(screen.getByRole('button', { name: 'Registrieren' })).toBeInTheDocument();
  });

  it('enthält Link zur Login-Seite', () => {
    renderRegisterPage();
    expect(screen.getByRole('link', { name: /anmelden/i })).toBeInTheDocument();
  });

  // ── Validierung ───────────────────────────────────────────────────────────

  it('zeigt Fehler bei leerem Klassen-Code nach Submit', async () => {
    renderRegisterPage();
    fireEvent.submit(getForm());
    expect(await screen.findByText('Bitte Klassen-Code eingeben.')).toBeInTheDocument();
  });

  it('zeigt Fehler bei ungültigem Klassen-Code (zu kurz)', async () => {
    renderRegisterPage();
    fireEvent.change(screen.getByLabelText('Klassen-Code'), { target: { value: 'ABC' } });
    fireEvent.submit(getForm());
    expect(
      await screen.findByText('Klassen-Code muss aus 6 Zeichen bestehen (Buchstaben und Ziffern).')
    ).toBeInTheDocument();
  });

  it('zeigt Fehler bei leerem Benutzernamen nach Submit', async () => {
    renderRegisterPage();
    fireEvent.change(screen.getByLabelText('Klassen-Code'), { target: { value: 'AB3C4D' } });
    fireEvent.submit(getForm());
    expect(await screen.findByText('Bitte Benutzernamen eingeben.')).toBeInTheDocument();
  });

  it('zeigt Fehler bei zu kurzem Benutzernamen (< 3 Zeichen)', async () => {
    renderRegisterPage();
    fireEvent.change(screen.getByLabelText('Klassen-Code'), { target: { value: 'AB3C4D' } });
    fireEvent.change(screen.getByLabelText('Benutzername'), { target: { value: 'ab' } });
    fireEvent.submit(getForm());
    expect(
      await screen.findByText('Benutzername muss mindestens 3 Zeichen lang sein.')
    ).toBeInTheDocument();
  });

  it('zeigt Fehler bei leerem PIN nach Submit', async () => {
    renderRegisterPage();
    fireEvent.change(screen.getByLabelText('Klassen-Code'), { target: { value: 'AB3C4D' } });
    fireEvent.change(screen.getByLabelText('Benutzername'), { target: { value: 'testuser' } });
    fireEvent.submit(getForm());
    expect(await screen.findByText('Bitte PIN eingeben.')).toBeInTheDocument();
  });

  it('zeigt Fehler bei ungültigem PIN (nicht 4 Ziffern)', async () => {
    renderRegisterPage();
    fillForm('AB3C4D', 'testuser', '12');
    fireEvent.submit(getForm());
    expect(await screen.findByText('PIN muss aus genau 4 Ziffern bestehen.')).toBeInTheDocument();
  });

  it('zeigt Fehler bei nicht-numerischem PIN', async () => {
    renderRegisterPage();
    fillForm('AB3C4D', 'testuser', 'abcd');
    fireEvent.submit(getForm());
    expect(await screen.findByText('PIN muss aus genau 4 Ziffern bestehen.')).toBeInTheDocument();
  });

  it('Klassen-Code-Eingabe wird automatisch großgeschrieben', () => {
    renderRegisterPage();
    const input = screen.getByLabelText('Klassen-Code');
    fireEvent.change(input, { target: { value: 'ab3c4d' } });
    expect(input).toHaveValue('AB3C4D');
  });

  // ── Submit-Verhalten ──────────────────────────────────────────────────────

  it('ruft register() mit username, pin und classCode auf', async () => {
    const mockRegister = vi.fn().mockResolvedValue(undefined);
    renderRegisterPage(makeAuthContext({ register: mockRegister }));

    fillForm();
    fireEvent.submit(getForm());

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('testuser', '1234', 'AB3C4D');
    });
  });

  it('navigiert auf "/" nach erfolgreicher Registrierung', async () => {
    const mockRegister = vi.fn().mockResolvedValue(undefined);
    renderRegisterPage(makeAuthContext({ register: mockRegister }));

    fillForm();
    fireEvent.submit(getForm());

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('zeigt Lade-Zustand während Submit (Button disabled)', async () => {
    let resolveRegister!: () => void;
    const mockRegister = vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveRegister = resolve;
        })
    );
    renderRegisterPage(makeAuthContext({ register: mockRegister }));

    fillForm();
    fireEvent.submit(getForm());

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Wird registriert\u2026' })).toBeDisabled();
    });

    act(() => {
      resolveRegister();
    });
  });

  it('zeigt Server-Fehlermeldung bei ungültigem Klassen-Code (404)', async () => {
    const mockRegister = vi.fn().mockRejectedValue({ status: 404 });
    renderRegisterPage(makeAuthContext({ register: mockRegister }));

    fillForm();
    fireEvent.submit(getForm());

    expect(
      await screen.findByText('Klassen-Code nicht gefunden oder Klasse nicht aktiv.')
    ).toBeInTheDocument();
  });

  it('zeigt Server-Fehlermeldung bei bereits vergebenem Benutzernamen (400)', async () => {
    const mockRegister = vi.fn().mockRejectedValue({
      status: 400,
      response: { data: { username: { message: 'The username is invalid.' } } },
    });
    renderRegisterPage(makeAuthContext({ register: mockRegister }));

    fillForm();
    fireEvent.submit(getForm());

    expect(
      await screen.findByText('Dieser Benutzername ist bereits vergeben.')
    ).toBeInTheDocument();
  });

  it('Button ist nach fehlgeschlagener Registrierung wieder aktiv', async () => {
    const mockRegister = vi.fn().mockRejectedValue({ status: 400 });
    renderRegisterPage(makeAuthContext({ register: mockRegister }));

    fillForm();
    fireEvent.submit(getForm());

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Registrieren' })).not.toBeDisabled();
    });
  });

  it('zeigt Netzwerk-Fehlermeldung bei Status 0', async () => {
    const mockRegister = vi.fn().mockRejectedValue({ status: 0 });
    renderRegisterPage(makeAuthContext({ register: mockRegister }));

    fillForm();
    fireEvent.submit(getForm());

    expect(
      await screen.findByText('Verbindung zum Server fehlgeschlagen. Bitte versuche es erneut.')
    ).toBeInTheDocument();
  });

  // ── Accessibility ─────────────────────────────────────────────────────────

  it('Felder haben aria-invalid="true" bei Validierungsfehler', async () => {
    renderRegisterPage();
    fireEvent.submit(getForm());

    await waitFor(() => {
      expect(screen.getByLabelText('Klassen-Code')).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByLabelText('Benutzername')).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByLabelText('PIN (4 Ziffern)')).toHaveAttribute('aria-invalid', 'true');
    });
  });

  it('Felder haben aria-describedby bei Fehlern', async () => {
    renderRegisterPage();
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
    renderRegisterPage();
    expect(screen.getByLabelText('Klassen-Code')).toHaveAttribute('aria-required', 'true');
    expect(screen.getByLabelText('Benutzername')).toHaveAttribute('aria-required', 'true');
    expect(screen.getByLabelText('PIN (4 Ziffern)')).toHaveAttribute('aria-required', 'true');
  });

  it('Server-Fehler-Container hat role="alert"', async () => {
    const mockRegister = vi.fn().mockRejectedValue({ status: 0 });
    renderRegisterPage(makeAuthContext({ register: mockRegister }));

    fillForm();
    fireEvent.submit(getForm());

    await waitFor(() => {
      expect(
        screen.getByText('Verbindung zum Server fehlgeschlagen. Bitte versuche es erneut.')
      ).toBeInTheDocument();
    });
    const alerts = screen.getAllByRole('alert');
    expect(alerts.length).toBeGreaterThan(0);
  });

  // ── Keyboard-Navigation ───────────────────────────────────────────────────

  it('Tab-Reihenfolge: Klassen-Code → Benutzername → PIN → Registrieren-Button', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    const classCodeInput = screen.getByLabelText('Klassen-Code');
    const usernameInput = screen.getByLabelText('Benutzername');
    const pinInput = screen.getByLabelText('PIN (4 Ziffern)');
    const submitButton = screen.getByRole('button', { name: 'Registrieren' });

    await user.tab();
    expect(classCodeInput).toHaveFocus();

    await user.tab();
    expect(usernameInput).toHaveFocus();

    await user.tab();
    expect(pinInput).toHaveFocus();

    await user.tab();
    expect(submitButton).toHaveFocus();
  });

  // ── Axe-Audit ─────────────────────────────────────────────────────────────

  it('hat keine automatisch erkennbaren a11y-Verletzungen', async () => {
    const { container } = renderRegisterPage();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
