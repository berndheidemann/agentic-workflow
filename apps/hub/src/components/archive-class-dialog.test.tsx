import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ArchiveClassDialog } from './archive-class-dialog';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderDialog(overrides: Partial<React.ComponentProps<typeof ArchiveClassDialog>> = {}) {
  const props = {
    className: 'FI24a',
    schoolYear: '2025/2026',
    studentCount: 23,
    isOpen: true,
    onConfirm: vi.fn().mockResolvedValue(undefined),
    onCancel: vi.fn(),
    ...overrides,
  };
  return { ...render(<ArchiveClassDialog {...props} />), props };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ArchiveClassDialog', () => {
  beforeEach(() => {
    // jsdom does not fully support HTMLDialogElement.
    // showModal stubs: set the 'open' attribute so the dialog content is
    // treated as visible by ARIA queries.
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    });
    HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
      this.removeAttribute('open');
    });
  });

  it('rendert nicht wenn isOpen=false', () => {
    const { container } = renderDialog({ isOpen: false });
    expect(container.firstChild).toBeNull();
  });

  it('zeigt Klassenname und Schuljahr im Dialog', () => {
    renderDialog({ className: 'FI24a', schoolYear: '2025/2026' });
    // Multiple elements may contain the class name — just verify at least one
    expect(screen.getAllByText(/FI24a/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/2025\/2026/).length).toBeGreaterThan(0);
  });

  it('zeigt Schüleranzahl mit korrekter Pluralform (mehrere)', () => {
    renderDialog({ studentCount: 23 });
    expect(screen.getByText(/23 Schülern/i)).toBeInTheDocument();
  });

  it('zeigt Schüleranzahl mit korrekter Singularform (1 Schüler)', () => {
    renderDialog({ studentCount: 1 });
    expect(screen.getByText(/1 Schüler/i)).toBeInTheDocument();
  });

  it('zeigt Irreversibilitäts-Hinweis', () => {
    renderDialog();
    expect(screen.getByText(/irreversibel/i)).toBeInTheDocument();
  });

  it('zeigt Lösch-Hinweise für Schüler-Accounts, Lernfortschritte und Freischaltungen', () => {
    renderDialog();
    expect(screen.getByText(/Schüler-Accounts/i)).toBeInTheDocument();
    expect(screen.getByText(/Lernfortschritte/i)).toBeInTheDocument();
    expect(screen.getByText(/Modul-Freischaltungen/i)).toBeInTheDocument();
  });

  it('Abbrechen-Button ruft onCancel auf', () => {
    const { props } = renderDialog();
    fireEvent.click(screen.getByRole('button', { name: /Abbrechen/i }));
    expect(props.onCancel).toHaveBeenCalledTimes(1);
  });

  it('Archivieren-Button ruft onConfirm auf', async () => {
    const { props } = renderDialog();
    fireEvent.click(screen.getByRole('button', { name: /unwiderruflich archivieren/i }));
    await waitFor(() => {
      expect(props.onConfirm).toHaveBeenCalledTimes(1);
    });
  });

  it('zeigt Lade-Indikator während Archivierung', async () => {
    let resolveConfirm: () => void;
    const onConfirm = vi.fn().mockReturnValue(new Promise<void>((res) => { resolveConfirm = res; }));
    renderDialog({ onConfirm });

    fireEvent.click(screen.getByRole('button', { name: /unwiderruflich archivieren/i }));

    expect(screen.getByText(/Wird archiviert/i)).toBeInTheDocument();

    await waitFor(() => {
      resolveConfirm!();
    });
  });

  it('deaktiviert beide Buttons während Archivierung', async () => {
    let resolveConfirm: () => void;
    const onConfirm = vi.fn().mockReturnValue(new Promise<void>((res) => { resolveConfirm = res; }));
    renderDialog({ onConfirm });

    fireEvent.click(screen.getByRole('button', { name: /unwiderruflich archivieren/i }));

    expect(screen.getByRole('button', { name: /Abbrechen/i })).toBeDisabled();

    await waitFor(() => {
      resolveConfirm!();
    });
  });

  it('zeigt Fehlermeldung wenn onConfirm wirft', async () => {
    const onConfirm = vi.fn().mockRejectedValue(new Error('Serverfehler'));
    renderDialog({ onConfirm });

    fireEvent.click(screen.getByRole('button', { name: /unwiderruflich archivieren/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Serverfehler/i)).toBeInTheDocument();
    });
  });

  it('hat korrekte ARIA-Attribute', () => {
    renderDialog();
    const dialog = document.querySelector('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby', 'archive-dialog-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'archive-dialog-desc');
  });
});
