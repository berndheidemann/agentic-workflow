// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ResetPinDialog } from './reset-pin-dialog';

// jsdom does not implement HTMLDialogElement.showModal/close natively.
// We also set/remove the 'open' attribute so dialog content becomes accessible.
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open');
  });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ResetPinDialog', () => {
  it('renders nothing when isOpen is false', () => {
    render(
      <ResetPinDialog
        studentName="max"
        isOpen={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows student name in dialog', () => {
    render(
      <ResetPinDialog
        studentName="max.mustermann"
        isOpen={true}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByText(/max\.mustermann/)).toBeDefined();
  });

  it('pre-fills a 4-digit PIN when opened', () => {
    render(
      <ResetPinDialog
        studentName="max"
        isOpen={true}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toMatch(/^\d{4}$/);
  });

  it('validates: shows error when PIN is not 4 digits', async () => {
    render(
      <ResetPinDialog
        studentName="max"
        isOpen={true}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '12' } });
    // Submit the form directly to bypass disabled button
    const form = input.closest('form')!;
    fireEvent.submit(form);
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/4 Ziffern/);
  });

  it('calls onConfirm with the entered PIN', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(
      <ResetPinDialog
        studentName="max"
        isOpen={true}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '5678' } });
    fireEvent.click(screen.getByRole('button', { name: /PIN setzen/ }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith('5678'));
  });

  it('shows success state with the new PIN after confirm', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(
      <ResetPinDialog
        studentName="max"
        isOpen={true}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '1234' } });
    fireEvent.click(screen.getByRole('button', { name: /PIN setzen/ }));
    await waitFor(() => expect(screen.getByText(/PIN zurückgesetzt/)).toBeDefined());
  });

  it('shows error when onConfirm rejects', async () => {
    const onConfirm = vi.fn().mockRejectedValue(new Error('Serverfehler'));
    render(
      <ResetPinDialog
        studentName="max"
        isOpen={true}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '1234' } });
    fireEvent.click(screen.getByRole('button', { name: /PIN setzen/ }));
    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert.textContent).toMatch(/PIN konnte nicht zurückgesetzt werden/);
    });
  });

  it('calls onCancel when Abbrechen is clicked', () => {
    const onCancel = vi.fn();
    render(
      <ResetPinDialog
        studentName="max"
        isOpen={true}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Abbrechen/ }));
    expect(onCancel).toHaveBeenCalled();
  });
});
