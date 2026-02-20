import type { CourseManifest } from '@lernplattform/shared';
import type { MatrixColumn } from './use-class-progress';

/**
 * Converts a CourseManifest into MatrixColumns.
 * Returns ALL columns (exercises) in manifest order — including exercises
 * no student has attempted yet. This solves the "unseen exercises invisible"
 * problem that existed when columns were derived only from progress records.
 *
 * Optional module filter: if provided, only exercises from that module are returned.
 */
export function manifestToColumns(
  manifest: CourseManifest,
  moduleFilter?: string | null
): MatrixColumn[] {
  const columns: MatrixColumn[] = [];

  for (const module of manifest.modules) {
    if (moduleFilter && module.id !== moduleFilter) continue;

    for (const lesson of module.lessons) {
      for (const exercise of lesson.exercises) {
        // lesson slug as-is, exercise id as-is — matches what progress records store
        columns.push({
          lesson: lesson.slug,
          exercise: exercise.id,
          label: exercise.title,
        });
      }
    }
  }

  return columns;
}

/**
 * Returns module options for the module filter dropdown, derived from a manifest.
 * Returns [{id, title}] in manifest (sidebar) order.
 */
export function manifestToModuleOptions(
  manifest: CourseManifest
): Array<{ id: string; title: string }> {
  return manifest.modules.map((m) => ({ id: m.id, title: m.title }));
}
