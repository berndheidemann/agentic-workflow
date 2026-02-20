// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CellDetailModal } from './cell-detail-modal';
import { ProgressMatrix } from './progress-matrix';
import type { MatrixCell, MatrixColumn, MatrixRow } from '../hooks/use-class-progress';
import type { User } from '@lernplattform/shared';

// jsdom does not implement HTMLDialogElement.showModal/close natively.
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open');
  });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const col: MatrixColumn = {
  lesson: 'lektion-1',
  exercise: 'aufgabe-1',
  label: 'lektion-1/aufgabe-1',
};

function makeCell(overrides?: Partial<MatrixCell>): MatrixCell {
  return {
    status: 'correct',
    progress: {
      id: 'p1',
      user_id: 'u1',
      course: 'ap1',
      lesson: 'lektion-1',
      exercise: 'aufgabe-1',
      status: 'completed',
      score: 8,
      max_score: 10,
      attempts: 3,
      completed_at: '2026-02-15T14:30:00Z',
      suspicious: false,
      created: '2026-02-15T14:30:00Z',
      updated: '2026-02-15T14:30:00Z',
    },
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CellDetailModal', () => {
  it('rendert nichts wenn isOpen=false', () => {
    const { container } = render(
      <CellDetailModal
        cell={makeCell()}
        column={col}
        studentName="anna"
        isOpen={false}
        onClose={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('rendert nichts wenn cell=null', () => {
    const { container } = render(
      <CellDetailModal
        cell={null}
        column={col}
        studentName="anna"
        isOpen={true}
        onClose={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('zeigt Titel "Aufgaben-Detail"', () => {
    render(
      <CellDetailModal
        cell={makeCell()}
        column={col}
        studentName="anna"
        isOpen={true}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByRole('heading', { name: /Aufgaben-Detail/i })).toBeInTheDocument();
  });

  it('zeigt Schülername und Spaltenbezeichnung', () => {
    render(
      <CellDetailModal
        cell={makeCell()}
        column={col}
        studentName="anna"
        isOpen={true}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText(/anna.*lektion-1\/aufgabe-1/i)).toBeInTheDocument();
  });

  it('zeigt Anzahl der Versuche', () => {
    render(
      <CellDetailModal
        cell={makeCell()}
        column={col}
        studentName="anna"
        isOpen={true}
        onClose={vi.fn()}
      />
    );
    const dd = screen.getByLabelText(/3 Versuche/i);
    expect(dd).toHaveTextContent('3');
  });

  it('zeigt Score als "X / Y"', () => {
    render(
      <CellDetailModal
        cell={makeCell()}
        column={col}
        studentName="anna"
        isOpen={true}
        onClose={vi.fn()}
      />
    );
    const dd = screen.getByLabelText(/8 von 10 Punkten/i);
    expect(dd).toHaveTextContent('8 / 10');
  });

  it('zeigt "—" für Score wenn max_score=0', () => {
    const cell = makeCell({ progress: { ...makeCell().progress!, score: 0, max_score: 0 } });
    render(
      <CellDetailModal
        cell={cell}
        column={col}
        studentName="anna"
        isOpen={true}
        onClose={vi.fn()}
      />
    );
    // The score dd shows "—" when maxScore is 0
    const dts = screen.getAllByRole('term');
    const punkteDt = dts.find((el) => el.textContent === 'Punkte');
    expect(punkteDt).toBeTruthy();
    const dd = punkteDt!.nextElementSibling;
    expect(dd).toHaveTextContent('—');
  });

  it('zeigt Status-Badge "Bestanden" für correct', () => {
    render(
      <CellDetailModal
        cell={makeCell({ status: 'correct' })}
        column={col}
        studentName="anna"
        isOpen={true}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('Bestanden')).toBeInTheDocument();
  });

  it('zeigt Status-Badge "Nicht bestanden" für incorrect', () => {
    render(
      <CellDetailModal
        cell={makeCell({ status: 'incorrect' })}
        column={col}
        studentName="anna"
        isOpen={true}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('Nicht bestanden')).toBeInTheDocument();
  });

  it('zeigt Status-Badge "Nicht angefangen" für unattempted', () => {
    render(
      <CellDetailModal
        cell={{ status: 'unattempted' }}
        column={col}
        studentName="anna"
        isOpen={true}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('Nicht angefangen')).toBeInTheDocument();
  });

  it('zeigt "—" für completed_at wenn kein Datum', () => {
    const cell = makeCell({ progress: { ...makeCell().progress!, completed_at: null } });
    render(
      <CellDetailModal
        cell={cell}
        column={col}
        studentName="anna"
        isOpen={true}
        onClose={vi.fn()}
      />
    );
    const dts = screen.getAllByRole('term');
    const abgeschlossenDt = dts.find((el) => el.textContent === 'Abgeschlossen');
    expect(abgeschlossenDt).toBeTruthy();
    const dd = abgeschlossenDt!.nextElementSibling;
    expect(dd).toHaveTextContent('—');
  });

  it('ruft onClose auf wenn Schließen-Button geklickt', async () => {
    const onClose = vi.fn();
    render(
      <CellDetailModal
        cell={makeCell()}
        column={col}
        studentName="anna"
        isOpen={true}
        onClose={onClose}
      />
    );
    const closeButtons = screen.getAllByRole('button', { name: /Schließen/i });
    fireEvent.click(closeButtons[closeButtons.length - 1]);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('ruft onClose auf wenn X-Button geklickt', async () => {
    const onClose = vi.fn();
    render(
      <CellDetailModal
        cell={makeCell()}
        column={col}
        studentName="anna"
        isOpen={true}
        onClose={onClose}
      />
    );
    const xButton = screen.getByRole('button', { name: /Detail schließen/i });
    fireEvent.click(xButton);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('dialog hat aria-labelledby und aria-describedby', () => {
    render(
      <CellDetailModal
        cell={makeCell()}
        column={col}
        studentName="anna"
        isOpen={true}
        onClose={vi.fn()}
      />
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby', 'cell-detail-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'cell-detail-desc');
  });

  // ── Suspicious-Anzeige ────────────────────────────────────────────────────

  it('zeigt "Verdächtig"-Badge wenn suspicious=true', () => {
    const cell = makeCell({ suspicious: true });
    render(
      <CellDetailModal
        cell={cell}
        column={col}
        studentName="anna"
        isOpen={true}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('Verdächtig')).toBeInTheDocument();
  });

  it('zeigt keinen "Verdächtig"-Badge wenn suspicious=false', () => {
    const cell = makeCell({ suspicious: false });
    render(
      <CellDetailModal
        cell={cell}
        column={col}
        studentName="anna"
        isOpen={true}
        onClose={vi.fn()}
      />
    );
    expect(screen.queryByText('Verdächtig')).not.toBeInTheDocument();
  });

  it('zeigt Hinweis-Note wenn suspicious=true', () => {
    const cell = makeCell({ suspicious: true });
    render(
      <CellDetailModal
        cell={cell}
        column={col}
        studentName="anna"
        isOpen={true}
        onClose={vi.fn()}
      />
    );
    const note = screen.getByRole('note');
    expect(note).toBeInTheDocument();
    expect(note).toHaveTextContent(/ungewöhnlich schnell/i);
  });

  it('zeigt keinen Hinweis-Note wenn suspicious=false', () => {
    const cell = makeCell({ suspicious: false });
    render(
      <CellDetailModal
        cell={cell}
        column={col}
        studentName="anna"
        isOpen={true}
        onClose={vi.fn()}
      />
    );
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });

  it('zeigt Hinweis dass kein harter Block erfolgt', () => {
    const cell = makeCell({ suspicious: true });
    render(
      <CellDetailModal
        cell={cell}
        column={col}
        studentName="anna"
        isOpen={true}
        onClose={vi.fn()}
      />
    );
    const note = screen.getByRole('note');
    expect(note).toHaveTextContent(/kein automatischer Block/i);
  });
});

describe('ProgressMatrix Zell-Klick', () => {
  it('öffnet Modal bei Klick auf Zellen-Button', () => {
    const col1: MatrixColumn = {
      lesson: 'lektion-1',
      exercise: 'aufgabe-1',
      label: 'lektion-1/aufgabe-1',
    };

    const progress = {
      id: 'p1',
      user_id: 'u1',
      course: 'ap1',
      lesson: 'lektion-1',
      exercise: 'aufgabe-1',
      status: 'completed' as const,
      score: 5,
      max_score: 10,
      attempts: 2,
      completed_at: '2026-01-10T10:00:00Z',
      suspicious: false,
      created: '2026-01-10T10:00:00Z',
      updated: '2026-01-10T10:00:00Z',
    };

    const student: User = {
      id: 's1',
      username: 'anna',
      email: '',
      emailVisibility: false,
      verified: true,
      role: 'student',
      class_id: 'cls1',
      display_name: '',
      created: '',
      updated: '',
    };

    const cells = new Map([['lektion-1::aufgabe-1', { status: 'correct' as const, progress }]]);
    const rows: MatrixRow[] = [{ student, cells }];

    render(<ProgressMatrix columns={[col1]} rows={rows} isLoading={false} error={null} />);

    const cellButton = screen.getByRole('button', {
      name: /Detail anzeigen: anna, lektion-1\/aufgabe-1/i,
    });
    fireEvent.click(cellButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Aufgaben-Detail/i })).toBeInTheDocument();
    expect(screen.getByText(/anna.*lektion-1\/aufgabe-1/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/2 Versuche/i)).toBeInTheDocument();
  });
});
