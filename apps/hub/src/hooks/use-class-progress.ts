import { useState, useEffect } from 'react';
import { useAuth } from '@lernplattform/shared';
import type { Progress, User, CourseManifest } from '@lernplattform/shared';
import { manifestToColumns } from './use-manifest-columns';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CellStatus = 'correct' | 'incorrect' | 'unattempted';

export interface MatrixCell {
  status: CellStatus;
  progress?: Progress;
  suspicious?: boolean;
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
 * When a CourseManifest is provided, columns are derived from the manifest
 * (all exercises in sidebar order, including unstarted ones). This is the
 * REQ-037 behavior: every exercise is always visible in the matrix.
 *
 * Without a manifest, columns are derived from the union of progress records
 * (backward-compatible fallback).
 */
export function useClassProgress(
  classId: string | null,
  course: string | null,
  manifest?: CourseManifest | null
): UseClassProgressReturn {
  const { pb } = useAuth();
  const [columns, setColumns] = useState<MatrixColumn[]>([]);
  const [rows, setRows] = useState<MatrixRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stable manifest identity — only re-run when manifest changes by course
  const manifestCourse = manifest?.course ?? null;

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

        let sortedColumns: MatrixColumn[];

        if (manifest && manifest.course === course) {
          // REQ-037: Use manifest for complete column set (all exercises, manifest order)
          sortedColumns = manifestToColumns(manifest);
        } else {
          // Fallback: derive columns from union of progress records
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
          sortedColumns = Array.from(columnSet.values()).sort((a, b) => {
            const lessonCmp = a.lesson.localeCompare(b.lesson);
            if (lessonCmp !== 0) return lessonCmp;
            return a.exercise.localeCompare(b.exercise);
          });
        }

        // Build rows
        const matrixRows: MatrixRow[] = students.map((student) => {
          const cells = new Map<string, MatrixCell>();
          for (const col of sortedColumns) {
            const key = cellKey(col.lesson, col.exercise);
            const progressEntry = progressIndex.get(`${student.id}::${key}`);
            cells.set(key, {
              status: computeCellStatus(progressEntry),
              progress: progressEntry,
              suspicious: progressEntry?.suspicious ?? false,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pb, classId, course, manifestCourse]);

  return { columns, rows, isLoading, error };
}
