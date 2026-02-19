import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { ProgressMatrix } from './progress-matrix';
import type { MatrixColumn, MatrixRow } from '../hooks/use-class-progress';
import type { User } from '@lernplattform/shared';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeStudent(id: string, username: string): User {
  return {
    id,
    username,
    email: '',
    emailVisibility: false,
    verified: true,
    role: 'student',
    class_id: 'cls-1',
    display_name: '',
    created: '',
    updated: '',
  };
}

const col1: MatrixColumn = { lesson: 'lektion-1', exercise: 'aufgabe-1', label: 'lektion-1/aufgabe-1' };
const col2: MatrixColumn = { lesson: 'lektion-1', exercise: 'aufgabe-2', label: 'lektion-1/aufgabe-2' };

function makeRow(student: User, statuses: Record<string, 'correct' | 'incorrect' | 'unattempted'>): MatrixRow {
  const cells = new Map(
    Object.entries(statuses).map(([key, status]) => [key, { status }])
  );
  return { student, cells };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ProgressMatrix', () => {
  it('zeigt Lade-Skeleton wenn isLoading=true', () => {
    render(<ProgressMatrix columns={[]} rows={[]} isLoading={true} error={null} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/geladen/i)).toBeInTheDocument();
  });

  it('hat aria-busy auf Lade-Element', () => {
    render(<ProgressMatrix columns={[]} rows={[]} isLoading={true} error={null} />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
  });

  it('zeigt Fehler-Alert bei error', () => {
    render(<ProgressMatrix columns={[]} rows={[]} isLoading={false} error="Verbindung fehlgeschlagen" />);
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent('Verbindung fehlgeschlagen');
  });

  it('zeigt Hinweistext wenn rows leer', () => {
    render(<ProgressMatrix columns={[col1]} rows={[]} isLoading={false} error={null} />);
    expect(screen.getByText(/Keine Fortschrittsdaten/i)).toBeInTheDocument();
  });

  it('zeigt Hinweistext wenn columns leer', () => {
    const row = makeRow(makeStudent('s1', 'anna'), {});
    render(<ProgressMatrix columns={[]} rows={[row]} isLoading={false} error={null} />);
    expect(screen.getByText(/Keine Fortschrittsdaten/i)).toBeInTheDocument();
  });

  it('rendert Tabelle mit korrekten Spalten-Headern', () => {
    const student = makeStudent('s1', 'anna');
    const row = makeRow(student, {
      'lektion-1::aufgabe-1': 'correct',
      'lektion-1::aufgabe-2': 'incorrect',
    });
    render(<ProgressMatrix columns={[col1, col2]} rows={[row]} isLoading={false} error={null} />);

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('lektion-1/aufgabe-1')).toBeInTheDocument();
    expect(screen.getByText('lektion-1/aufgabe-2')).toBeInTheDocument();
  });

  it('rendert Schülernamen in erster Spalte als row-Header', () => {
    const student = makeStudent('s1', 'anna');
    const row = makeRow(student, { 'lektion-1::aufgabe-1': 'correct' });
    render(<ProgressMatrix columns={[col1]} rows={[row]} isLoading={false} error={null} />);

    const rowHeader = screen.getByRole('rowheader', { name: /anna/i });
    expect(rowHeader).toBeInTheDocument();
  });

  it('rendert grüne Zelle mit Label "Geschafft" für correct', () => {
    const student = makeStudent('s1', 'anna');
    const row = makeRow(student, { 'lektion-1::aufgabe-1': 'correct' });
    render(<ProgressMatrix columns={[col1]} rows={[row]} isLoading={false} error={null} />);

    const cell = screen.getByRole('cell', { name: /anna.*lektion-1\/aufgabe-1.*Geschafft/i });
    expect(cell).toBeInTheDocument();
    expect(cell.className).toContain('bg-green-100');
  });

  it('rendert orangene Zelle mit Label für incorrect', () => {
    const student = makeStudent('s1', 'bert');
    const row = makeRow(student, { 'lektion-1::aufgabe-1': 'incorrect' });
    render(<ProgressMatrix columns={[col1]} rows={[row]} isLoading={false} error={null} />);

    const cell = screen.getByRole('cell', { name: /bert.*lektion-1\/aufgabe-1.*Versucht/i });
    expect(cell).toBeInTheDocument();
    expect(cell.className).toContain('bg-orange-100');
  });

  it('rendert graue Zelle mit Label für unattempted', () => {
    const student = makeStudent('s1', 'carl');
    const row = makeRow(student, { 'lektion-1::aufgabe-1': 'unattempted' });
    render(<ProgressMatrix columns={[col1]} rows={[row]} isLoading={false} error={null} />);

    const cell = screen.getByRole('cell', { name: /carl.*lektion-1\/aufgabe-1.*Nicht angefangen/i });
    expect(cell).toBeInTheDocument();
    expect(cell.className).toContain('bg-gray-100');
  });

  it('hat overflow-x-auto Container für horizontalen Scroll', () => {
    const student = makeStudent('s1', 'anna');
    const row = makeRow(student, { 'lektion-1::aufgabe-1': 'correct' });
    const { container } = render(
      <ProgressMatrix columns={[col1]} rows={[row]} isLoading={false} error={null} />
    );

    const scrollContainer = container.querySelector('.overflow-x-auto');
    expect(scrollContainer).toBeInTheDocument();
  });

  it('Tabelle hat aria-label und caption für Screen Reader', () => {
    const student = makeStudent('s1', 'anna');
    const row = makeRow(student, { 'lektion-1::aufgabe-1': 'correct' });
    render(<ProgressMatrix columns={[col1]} rows={[row]} isLoading={false} error={null} />);

    const table = screen.getByRole('table', { name: /Schüler-Fortschritt/i });
    expect(table).toBeInTheDocument();
    const caption = table.querySelector('caption');
    expect(caption).toBeInTheDocument();
  });

  it('rendert mehrere Schüler-Zeilen', () => {
    const row1 = makeRow(makeStudent('s1', 'anna'), { 'lektion-1::aufgabe-1': 'correct' });
    const row2 = makeRow(makeStudent('s2', 'bert'), { 'lektion-1::aufgabe-1': 'incorrect' });
    render(<ProgressMatrix columns={[col1]} rows={[row1, row2]} isLoading={false} error={null} />);

    expect(screen.getByRole('rowheader', { name: 'anna' })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: 'bert' })).toBeInTheDocument();
  });

  // ─── Aggregate row tests ────────────────────────────────────────────────────

  it('zeigt Aggregat-Zeile mit "Klasse gesamt" Label', () => {
    const row = makeRow(makeStudent('s1', 'anna'), { 'lektion-1::aufgabe-1': 'correct' });
    render(<ProgressMatrix columns={[col1]} rows={[row]} isLoading={false} error={null} />);

    expect(screen.getByRole('rowheader', { name: /Klasse gesamt/i })).toBeInTheDocument();
  });

  it('berechnet 100% wenn alle Schüler correct', () => {
    const row1 = makeRow(makeStudent('s1', 'anna'), { 'lektion-1::aufgabe-1': 'correct' });
    const row2 = makeRow(makeStudent('s2', 'bert'), { 'lektion-1::aufgabe-1': 'correct' });
    render(<ProgressMatrix columns={[col1]} rows={[row1, row2]} isLoading={false} error={null} />);

    const cell = screen.getByRole('cell', { name: /lektion-1\/aufgabe-1.*100%/i });
    expect(cell).toHaveTextContent('100%');
  });

  it('berechnet 0% wenn kein Schüler correct', () => {
    const row1 = makeRow(makeStudent('s1', 'anna'), { 'lektion-1::aufgabe-1': 'incorrect' });
    const row2 = makeRow(makeStudent('s2', 'bert'), { 'lektion-1::aufgabe-1': 'unattempted' });
    render(<ProgressMatrix columns={[col1]} rows={[row1, row2]} isLoading={false} error={null} />);

    const cell = screen.getByRole('cell', { name: /lektion-1\/aufgabe-1.*0%/i });
    expect(cell).toHaveTextContent('0%');
  });

  it('berechnet 50% wenn 1 von 2 Schülern correct', () => {
    const row1 = makeRow(makeStudent('s1', 'anna'), { 'lektion-1::aufgabe-1': 'correct' });
    const row2 = makeRow(makeStudent('s2', 'bert'), { 'lektion-1::aufgabe-1': 'incorrect' });
    render(<ProgressMatrix columns={[col1]} rows={[row1, row2]} isLoading={false} error={null} />);

    const cell = screen.getByRole('cell', { name: /lektion-1\/aufgabe-1.*50%/i });
    expect(cell).toHaveTextContent('50%');
  });

  it('zeigt separate Prozentsätze pro Spalte', () => {
    const row1 = makeRow(makeStudent('s1', 'anna'), {
      'lektion-1::aufgabe-1': 'correct',
      'lektion-1::aufgabe-2': 'incorrect',
    });
    const row2 = makeRow(makeStudent('s2', 'bert'), {
      'lektion-1::aufgabe-1': 'correct',
      'lektion-1::aufgabe-2': 'correct',
    });
    render(<ProgressMatrix columns={[col1, col2]} rows={[row1, row2]} isLoading={false} error={null} />);

    const cell1 = screen.getByRole('cell', { name: /lektion-1\/aufgabe-1.*100%/i });
    expect(cell1).toHaveTextContent('100%');
    const cell2 = screen.getByRole('cell', { name: /lektion-1\/aufgabe-2.*50%/i });
    expect(cell2).toHaveTextContent('50%');
  });

  it('zeigt keine Aggregat-Zeile wenn keine Daten', () => {
    render(<ProgressMatrix columns={[]} rows={[]} isLoading={false} error={null} />);
    expect(screen.queryByText(/Klasse gesamt/i)).not.toBeInTheDocument();
  });

  // ── Keyboard-Navigation ───────────────────────────────────────────────────

  it('Tabellen-Zellen-Buttons sind per Tab erreichbar', () => {
    const row = makeRow(makeStudent('s1', 'anna'), { 'lektion-1::aufgabe-1': 'correct' });
    render(<ProgressMatrix columns={[col1]} rows={[row]} isLoading={false} error={null} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    // All buttons should be focusable (no tabIndex=-1)
    for (const btn of buttons) {
      expect(btn).not.toHaveAttribute('tabindex', '-1');
    }
  });

  // ── Axe-Audit ─────────────────────────────────────────────────────────────

  it('hat keine automatisch erkennbaren a11y-Verletzungen (leere Matrix)', async () => {
    const { container } = render(
      <ProgressMatrix columns={[]} rows={[]} isLoading={false} error={null} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('hat keine automatisch erkennbaren a11y-Verletzungen (Matrix mit Daten)', async () => {
    const row = makeRow(makeStudent('s1', 'anna'), { 'lektion-1::aufgabe-1': 'correct' });
    const { container } = render(
      <ProgressMatrix columns={[col1]} rows={[row]} isLoading={false} error={null} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
