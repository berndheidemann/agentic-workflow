export type { CourseManifest, ManifestModule, ManifestLesson, ManifestExercise } from './types';

/**
 * Validates that a plain object conforms to the CourseManifest schema.
 * Returns the typed manifest if valid, null otherwise.
 */
export function validateManifest(data: unknown): import('./types').CourseManifest | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  if (d['version'] !== 1) return null;
  if (typeof d['course'] !== 'string' || !d['course']) return null;
  if (typeof d['name'] !== 'string' || !d['name']) return null;
  if (typeof d['generatedAt'] !== 'string') return null;
  if (!Array.isArray(d['modules'])) return null;
  if (typeof d['totalExercises'] !== 'number') return null;
  return data as import('./types').CourseManifest;
}
