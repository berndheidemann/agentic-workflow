import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@lernplattform/shared';
import type { CourseUnlock, User, Progress } from '@lernplattform/shared';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ModuleStatus = 'unlocked' | 'locked' | 'completed';

export interface ModuleUnlockState {
  moduleId: string;
  status: ModuleStatus;
  recordId: string | null;
}

export interface UseModuleUnlocksReturn {
  modules: ModuleUnlockState[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  toggleModule: (moduleId: string) => Promise<void>;
  unlockUpTo: (moduleId: string, allModuleIds: string[]) => Promise<void>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns true if a progress lesson belongs to the given module.
 * lesson is the full path after the course segment (e.g. "wirtschaft/lektion-1").
 * moduleId is the first segment (e.g. "wirtschaft").
 */
function lessonBelongsToModule(lesson: string, moduleId: string): boolean {
  return lesson === moduleId || lesson.startsWith(moduleId + '/');
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Teacher-side hook for managing module unlock state per class and course.
 * Loads existing course_unlocks records and provides methods to toggle/bulk-update.
 *
 * Default behavior: no records = all unlocked.
 * Once a teacher creates ANY lock for a course+class, all modules get explicit records.
 *
 * Status derivation:
 *   - 'locked':    unlock record exists with is_unlocked = false
 *   - 'completed': module is unlocked AND at least one student in the class has a
 *                  completed progress entry for this module
 *   - 'unlocked':  module is unlocked, no completed progress yet
 */
export function useModuleUnlocks(
  classId: string | null,
  course: string | null,
  moduleIds: string[],
): UseModuleUnlocksReturn {
  const { pb, user } = useAuth();
  const [records, setRecords] = useState<CourseUnlock[]>([]);
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load unlock records + progress data in parallel
  useEffect(() => {
    if (!classId || !course) {
      setRecords([]);
      setCompletedModules(new Set());
      setIsLoading(false);
      setError(null);
      return;
    }

    let stale = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        // Run all three queries in parallel
        const [unlockRecords, students, progressRecords] = await Promise.all([
          pb.collection('course_unlocks').getFullList<CourseUnlock>({
            filter: `class_id = "${classId}" && course = "${course}" && user_id = ""`,
          }),
          pb.collection('users').getFullList<User>({
            filter: `class_id = "${classId}"`,
            fields: 'id',
          }),
          pb.collection('progress').getFullList<Progress>({
            filter: `course = "${course}" && status = "completed"`,
            fields: 'lesson,user_id',
          }),
        ]);

        if (stale) return;

        // Build set of student IDs for this class
        const studentIds = new Set(students.map((s) => s.id));

        // Find which modules have at least one completed entry from a class student
        const completed = new Set<string>();
        for (const p of progressRecords) {
          if (!studentIds.has(p.user_id)) continue;
          for (const moduleId of moduleIds) {
            if (lessonBelongsToModule(p.lesson, moduleId)) {
              completed.add(moduleId);
              break;
            }
          }
        }

        setRecords(unlockRecords);
        setCompletedModules(completed);
      } catch (err) {
        if (stale) return;
        const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
        setError(`Freischaltungsdaten konnten nicht geladen werden: ${message}`);
        setRecords([]);
        setCompletedModules(new Set());
      } finally {
        if (!stale) setIsLoading(false);
      }
    }

    load();
    return () => { stale = true; };
  }, [pb, classId, course, moduleIds]);

  // Derive module states from records + completed progress
  const modules: ModuleUnlockState[] = (!classId || !course) ? [] : moduleIds.map((moduleId) => {
    const record = records.find((r) => r.module === moduleId);
    const isLocked = record ? !record.is_unlocked : false;

    if (isLocked) {
      return { moduleId, status: 'locked' as ModuleStatus, recordId: record!.id };
    }

    // Module is unlocked — check if any student has completed work here
    if (completedModules.has(moduleId)) {
      return { moduleId, status: 'completed' as ModuleStatus, recordId: record?.id ?? null };
    }

    return { moduleId, status: 'unlocked' as ModuleStatus, recordId: record?.id ?? null };
  });

  // Ensure all modules have explicit records (create missing ones)
  const ensureAllRecords = useCallback(async (
    currentRecords: CourseUnlock[],
    targetModuleIds: string[],
    defaultUnlocked: boolean,
  ): Promise<CourseUnlock[]> => {
    if (!classId || !course || !user?.id) return currentRecords;

    const existingModules = new Set(currentRecords.map((r) => r.module));
    const missing = targetModuleIds.filter((id) => !existingModules.has(id));

    const created: CourseUnlock[] = [];
    for (const moduleId of missing) {
      const newRecord = await pb.collection('course_unlocks').create<CourseUnlock>({
        class_id: classId,
        course,
        module: moduleId,
        is_unlocked: defaultUnlocked,
        unlocked_by: user.id,
      });
      created.push(newRecord);
    }

    return [...currentRecords, ...created];
  }, [pb, classId, course, user?.id]);

  // Toggle a single module
  const toggleModule = useCallback(async (moduleId: string) => {
    if (!classId || !course || !user?.id) return;

    setIsSaving(true);
    setError(null);
    try {
      // Ensure all modules have records first
      let allRecords = await ensureAllRecords(records, moduleIds, true);

      const record = allRecords.find((r) => r.module === moduleId);
      if (record) {
        // Update existing record
        const updated = await pb.collection('course_unlocks').update<CourseUnlock>(record.id, {
          is_unlocked: !record.is_unlocked,
        });
        allRecords = allRecords.map((r) => r.id === updated.id ? updated : r);
      } else {
        // Should not happen after ensureAllRecords, but handle gracefully
        const newRecord = await pb.collection('course_unlocks').create<CourseUnlock>({
          class_id: classId,
          course,
          module: moduleId,
          is_unlocked: false,
          unlocked_by: user.id,
        });
        allRecords = [...allRecords, newRecord];
      }

      setRecords(allRecords);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
      setError(`Fehler beim Ändern der Freischaltung: ${message}`);
    } finally {
      setIsSaving(false);
    }
  }, [pb, classId, course, user?.id, records, moduleIds, ensureAllRecords]);

  // Unlock all modules up to and including the given module
  const unlockUpTo = useCallback(async (moduleId: string, allModuleIds: string[]) => {
    if (!classId || !course || !user?.id) return;

    const targetIndex = allModuleIds.indexOf(moduleId);
    if (targetIndex === -1) return;

    setIsSaving(true);
    setError(null);
    try {
      // Ensure all modules have records
      let allRecords = await ensureAllRecords(records, allModuleIds, true);

      // Update each module: unlock up to targetIndex, lock after
      for (const record of allRecords) {
        const idx = allModuleIds.indexOf(record.module);
        const shouldBeUnlocked = idx <= targetIndex;
        if (record.is_unlocked !== shouldBeUnlocked) {
          const updated = await pb.collection('course_unlocks').update<CourseUnlock>(record.id, {
            is_unlocked: shouldBeUnlocked,
          });
          allRecords = allRecords.map((r) => r.id === updated.id ? updated : r);
        }
      }

      setRecords(allRecords);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
      setError(`Fehler bei der Bulk-Freischaltung: ${message}`);
    } finally {
      setIsSaving(false);
    }
  }, [pb, classId, course, user?.id, records, ensureAllRecords]);

  return { modules, isLoading, isSaving, error, toggleModule, unlockUpTo };
}
