import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '@lernplattform/shared';
import type { AuthContextValue } from '@lernplattform/shared';
import type { Class } from '@lernplattform/shared';
import { CreateClassForm } from './create-class-form';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockCreate = vi.fn();

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
      collection: () => ({ create: mockCreate }),
    } as unknown as AuthContextValue['pb'],
    ...overrides,
  };
}

function renderForm(props: Partial<React.ComponentProps<typeof CreateClassForm>> = {}) {
  const onCreated = vi.fn();
  const onCancel = vi.fn();
  return {
    onCreated,
    onCancel,
    ...render(
      <MemoryRouter>
        <AuthContext.Provider value={makeAuthContext()}>
          <CreateClassForm onCreated={onCreated} onCancel={onCancel} {...props} />
        </AuthContext.Provider>
      </MemoryRouter>
    ),
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CreateClassForm', () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it('rendert Name- und Schuljahr-Felder', () => {
    renderForm();
    expect(screen.getByLabelText(/Klassenname/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Schuljahr/i)).toBeInTheDocument();
  });

  it('Labels sind korrekt mit Inputs verknüpft', () => {
    renderForm();
    const nameInput = screen.getByLabelText(/Klassenname/i);
    const yearInput = screen.getByLabelText(/Schuljahr/i);
    expect(nameInput).toHaveAttribute('id', 'class-name');
    expect(yearInput).toHaveAttribute('id', 'school-year');
  });

  it('zeigt Fehlermeldung bei leerem Klassenname', async () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: /Klasse erstellen/i }));
    await waitFor(() => {
      expect(screen.getByText(/Bitte Klassenname eingeben/i)).toBeInTheDocument();
    });
  });

  it('zeigt Fehlermeldung bei leerem Schuljahr', async () => {
    renderForm();
    fireEvent.change(screen.getByLabelText(/Klassenname/i), { target: { value: 'FI24a' } });
    fireEvent.click(screen.getByRole('button', { name: /Klasse erstellen/i }));
    await waitFor(() => {
      expect(screen.getByText(/Bitte Schuljahr eingeben/i)).toBeInTheDocument();
    });
  });

  it('setzt aria-invalid bei Validierungsfehlern', async () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: /Klasse erstellen/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/Klassenname/i)).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByLabelText(/Schuljahr/i)).toHaveAttribute('aria-invalid', 'true');
    });
  });

  it('ruft onCreated nach erfolgreichem Submit auf', async () => {
    const newClass: Partial<Class> = { id: 'cls-1', name: 'FI24a', join_code: 'ABCDEF', school_year: '2025/2026', is_active: true, created_by: 'teacher-1' };
    mockCreate.mockResolvedValueOnce(newClass);

    const { onCreated } = renderForm();
    fireEvent.change(screen.getByLabelText(/Klassenname/i), { target: { value: 'FI24a' } });
    fireEvent.change(screen.getByLabelText(/Schuljahr/i), { target: { value: '2025/2026' } });
    fireEvent.click(screen.getByRole('button', { name: /Klasse erstellen/i }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        name: 'FI24a',
        school_year: '2025/2026',
        is_active: true,
        created_by: 'teacher-1',
      });
      expect(onCreated).toHaveBeenCalledWith(newClass);
    });
  });

  it('zeigt Fehlermeldung bei Server-Fehler', async () => {
    mockCreate.mockRejectedValueOnce(new Error('Server error'));

    renderForm();
    fireEvent.change(screen.getByLabelText(/Klassenname/i), { target: { value: 'FI24a' } });
    fireEvent.change(screen.getByLabelText(/Schuljahr/i), { target: { value: '2025/2026' } });
    fireEvent.click(screen.getByRole('button', { name: /Klasse erstellen/i }));

    await waitFor(() => {
      expect(screen.getByText(/konnte nicht erstellt werden/i)).toBeInTheDocument();
    });
  });

  it('deaktiviert Submit-Button während des Submitens', async () => {
    mockCreate.mockImplementation(() => new Promise(() => {})); // never resolves

    renderForm();
    fireEvent.change(screen.getByLabelText(/Klassenname/i), { target: { value: 'FI24a' } });
    fireEvent.change(screen.getByLabelText(/Schuljahr/i), { target: { value: '2025/2026' } });
    fireEvent.click(screen.getByRole('button', { name: /Klasse erstellen/i }));

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /Erstelle/i });
      expect(btn).toBeDisabled();
      expect(btn).toHaveAttribute('aria-busy', 'true');
    });
  });

  it('ruft onCancel bei Abbrechen-Button auf', () => {
    const { onCancel } = renderForm();
    fireEvent.click(screen.getByRole('button', { name: /Abbrechen/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('setzt aria-describedby bei Fehlern', async () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: /Klasse erstellen/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/Klassenname/i)).toHaveAttribute('aria-describedby', 'class-name-error');
    });
  });
});
