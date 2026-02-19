import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@lernplattform/shared';
import type { CourseUnlock } from '@lernplattform/shared';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ModuleStatus = 'unlocked' | 'locked';

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

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Teacher-side hook for managing module unlock state per class and course.
 * Loads existing course_unlocks records and provides methods to toggle/bulk-update.
 *
 * Default behavior: no records = all unlocked.
 * Once a teacher creates ANY lock for a course+class, all modules get explicit records.
 */
export function useModuleUnlocks(
  classId: string | null,
  course: string | null,
  moduleIds: string[],
): UseModuleUnlocksReturn {
  const { pb, user } = useAuth();
  const [records, setRecords] = useState<CourseUnlock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing unlock records
  useEffect(() => {
    if (!classId || !course) {
      setRecords([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    let stale = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await pb.collection('course_unlocks').getFullList<CourseUnlock>({
          filter: `class_id = "${classId}" && course = "${course}" && user_id = ""`,
        });
        if (!stale) setRecords(result);
      } catch (err) {
        if (stale) return;
        const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
        setError(`Freischaltungsdaten konnten nicht geladen werden: ${message}`);
        setRecords([]);
      } finally {
        if (!stale) setIsLoading(false);
      }
    }

    load();
    return () => { stale = true; };
  }, [pb, classId, course]);

  // Derive module states from records (only when both classId and course are selected)
  const modules: ModuleUnlockState[] = (!classId || !course) ? [] : moduleIds.map((moduleId) => {
    const record = records.find((r) => r.module === moduleId);
    if (!record) {
      // No record = default unlocked
      return { moduleId, status: 'unlocked' as ModuleStatus, recordId: null };
    }
    return {
      moduleId,
      status: record.is_unlocked ? 'unlocked' : 'locked',
      recordId: record.id,
    };
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
