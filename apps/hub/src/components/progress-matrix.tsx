import { useState } from 'react';
import type { MatrixColumn, MatrixRow, CellStatus, MatrixCell } from '../hooks/use-class-progress';
import { CellDetailModal } from './cell-detail-modal';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProgressMatrixProps {
  columns: MatrixColumn[];
  rows: MatrixRow[];
  isLoading: boolean;
  error: string | null;
}

interface SelectedCell {
  cell: MatrixCell;
  column: MatrixColumn;
  studentName: string;
}

// ─── Cell styling ─────────────────────────────────────────────────────────────

const CELL_STYLES: Record<CellStatus, { bg: string; label: string }> = {
  correct: {
    bg: 'bg-green-100 text-green-800',
    label: 'Geschafft',
  },
  incorrect: {
    bg: 'bg-orange-100 text-orange-800',
    label: 'Versucht, nicht bestanden',
  },
  unattempted: {
    bg: 'bg-gray-100 text-gray-600',
    label: 'Nicht angefangen',
  },
};

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className="animate-pulse">
      <span className="sr-only">Fortschrittsdaten werden geladen…</span>
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Header skeleton */}
          <div className="flex gap-2 mb-2">
            <div className="w-32 h-6 bg-gray-200 rounded" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-20 h-6 bg-gray-200 rounded" />
            ))}
          </div>
          {/* Row skeletons */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-2 mb-2">
              <div className="w-32 h-8 bg-gray-200 rounded" />
              {[1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="w-20 h-8 bg-gray-200 rounded" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Pure presentation component: renders a student × exercise matrix.
 * Data is provided by useClassProgress hook; this component has no side effects.
 */
export function ProgressMatrix({ columns, rows, isLoading, error }: ProgressMatrixProps) {
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div
        role="alert"
        className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm"
      >
        {error}
      </div>
    );
  }

  if (rows.length === 0 || columns.length === 0) {
    return (
      <p className="text-gray-500 text-sm py-4">
        Keine Fortschrittsdaten vorhanden. Wähle eine Klasse und einen Kurs aus.
      </p>
    );
  }

  return (
    <>
    <div className="overflow-x-auto" role="region" aria-label="Fortschrittsmatrix">
      <table
        className="min-w-full border-collapse text-sm"
        aria-label="Schüler-Fortschritt"
      >
        <caption className="sr-only">
          Fortschrittsmatrix: Schüler in Zeilen, Aufgaben in Spalten.
          Grün = bestanden, Orange = versucht aber nicht bestanden, Grau = nicht angefangen.
        </caption>
        <thead>
          <tr>
            <th
              scope="col"
              className="sticky left-0 z-10 bg-white px-3 py-2 text-left font-semibold text-gray-700 border-b border-r border-gray-200 min-w-[8rem]"
            >
              Schüler
            </th>
            {columns.map((col) => (
              <th
                key={`${col.lesson}::${col.exercise}`}
                scope="col"
                className="px-2 py-2 text-center font-medium text-gray-600 border-b border-gray-200 min-w-[5rem] max-w-[8rem] truncate"
                title={col.label}
              >
                <span className="block truncate text-xs">{col.label}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.student.id} className="hover:bg-gray-50">
              <th
                scope="row"
                className="sticky left-0 z-10 bg-white px-3 py-2 text-left font-medium text-gray-800 border-r border-b border-gray-100 truncate max-w-[8rem]"
                title={row.student.username}
              >
                {row.student.username}
              </th>
              {columns.map((col) => {
                const key = `${col.lesson}::${col.exercise}`;
                const cell = row.cells.get(key) ?? { status: 'unattempted' as CellStatus };
                const style = CELL_STYLES[cell.status];
                return (
                  <td
                    key={key}
                    className={`px-2 py-2 text-center border-b border-gray-100 ${style.bg}`}
                    aria-label={`${row.student.username}, ${col.label}: ${style.label}`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedCell({
                          cell,
                          column: col,
                          studentName: row.student.username,
                        })
                      }
                      aria-label={`Detail anzeigen: ${row.student.username}, ${col.label}`}
                      className="w-full h-full min-w-[2rem] min-h-[1.5rem] rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                    >
                      <span className="sr-only">{style.label}</span>
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        {/* Aggregate row: completion percentage per column */}
        <tfoot>
          <tr className="bg-blue-50">
            <th
              scope="row"
              className="sticky left-0 z-10 bg-blue-50 px-3 py-2 text-left font-semibold text-blue-800 border-t-2 border-r border-blue-200 min-w-[8rem] text-xs"
            >
              Klasse gesamt
            </th>
            {columns.map((col) => {
              const key = `${col.lesson}::${col.exercise}`;
              const total = rows.length;
              let correct = 0;
              for (const row of rows) {
                const cell = row.cells.get(key);
                if (cell?.status === 'correct') correct++;
              }
              const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
              return (
                <td
                  key={key}
                  className="px-2 py-2 text-center border-t-2 border-blue-200 text-xs font-semibold text-blue-800"
                  aria-label={`${col.label}: ${pct}% der Klasse hat diese Aufgabe geschafft`}
                >
                  {pct}%
                </td>
              );
            })}
          </tr>
        </tfoot>
      </table>
    </div>

    <CellDetailModal
      cell={selectedCell?.cell ?? null}
      column={selectedCell?.column ?? null}
      studentName={selectedCell?.studentName ?? ''}
      isOpen={selectedCell !== null}
      onClose={() => setSelectedCell(null)}
    />
    </>
  );
}
