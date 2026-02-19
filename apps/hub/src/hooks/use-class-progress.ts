import { useState, useEffect } from 'react';
import { useAuth } from '@lernplattform/shared';
import type { Progress, User } from '@lernplattform/shared';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CellStatus = 'correct' | 'incorrect' | 'unattempted';

export interface MatrixCell {
  status: CellStatus;
  progress?: Progress;
}

export interface MatrixColumn {
  lesson: string;
  exercise: string;
  label: string;
}

export interface MatrixRow {
  student: User;
  cells: Map<string, MatrixCell>;
}

export interface UseClassProgressReturn {
  columns: MatrixColumn[];
  rows: MatrixRow[];
  isLoading: boolean;
  error: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Maps a Progress record (or absence thereof) to a display status. */
export function computeCellStatus(progress: Progress | undefined): CellStatus {
  if (!progress) return 'unattempted';
  if (progress.status === 'completed' && progress.score >= progress.max_score) return 'correct';
  return 'incorrect';
}

function cellKey(lesson: string, exercise: string): string {
  return `${lesson}::${exercise}`;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Loads all progress data for a given class and course from PocketBase.
 * Returns a matrix of students (rows) × exercises (columns).
 *
 * Columns are derived from the union of all (lesson, exercise) combinations
 * found in progress records. Exercises not yet attempted by any student are
 * not shown (REQ-037 manifest will fill those gaps later).
 */
export function useClassProgress(
  classId: string | null,
  course: string | null
): UseClassProgressReturn {
  const { pb } = useAuth();
  const [columns, setColumns] = useState<MatrixColumn[]>([]);
  const [rows, setRows] = useState<MatrixRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!classId || !course) {
      setColumns([]);
      setRows([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    let stale = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        // Load students and progress in parallel
        const [students, progressRecords] = await Promise.all([
          pb.collection('users').getFullList<User>({
            filter: `class_id = "${classId}"`,
            sort: 'username',
          }),
          pb.collection('progress').getFullList<Progress>({
            filter: `course = "${course}"`,
          }),
        ]);

        if (stale) return;

        // Index progress by user_id + cell key for O(1) lookup
        const progressIndex = new Map<string, Progress>();
        for (const p of progressRecords) {
          const key = `${p.user_id}::${cellKey(p.lesson, p.exercise)}`;
          progressIndex.set(key, p);
        }

        // Derive columns from union of all (lesson, exercise) combos,
        // filtered to students in this class
        const studentIds = new Set(students.map((s) => s.id));
        const columnSet = new Map<string, MatrixColumn>();

        for (const p of progressRecords) {
          if (!studentIds.has(p.user_id)) continue;
          const key = cellKey(p.lesson, p.exercise);
          if (!columnSet.has(key)) {
            columnSet.set(key, {
              lesson: p.lesson,
              exercise: p.exercise,
              label: `${p.lesson}/${p.exercise}`,
            });
          }
        }

        // Sort columns: lesson alphabetically, then exercise alphabetically
        const sortedColumns = Array.from(columnSet.values()).sort((a, b) => {
          const lessonCmp = a.lesson.localeCompare(b.lesson);
          if (lessonCmp !== 0) return lessonCmp;
          return a.exercise.localeCompare(b.exercise);
        });

        // Build rows
        const matrixRows: MatrixRow[] = students.map((student) => {
          const cells = new Map<string, MatrixCell>();
          for (const col of sortedColumns) {
            const key = cellKey(col.lesson, col.exercise);
            const progressEntry = progressIndex.get(`${student.id}::${key}`);
            cells.set(key, {
              status: computeCellStatus(progressEntry),
              progress: progressEntry,
            });
          }
          return { student, cells };
        });

        setColumns(sortedColumns);
        setRows(matrixRows);
      } catch (err) {
        if (stale) return;
        const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
        setError(`Fortschrittsdaten konnten nicht geladen werden: ${message}`);
        setColumns([]);
        setRows([]);
      } finally {
        if (!stale) setIsLoading(false);
      }
    }

    load();
    return () => {
      stale = true;
    };
  }, [pb, classId, course]);

  return { columns, rows, isLoading, error };
}
