import { useState, useCallback } from 'react';
import { useAuth } from '@lernplattform/shared';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ArchiveResult {
  archived: boolean;
  deletedStudents: number;
}

export interface UseArchiveClassReturn {
  archiveClass: (classId: string) => Promise<ArchiveResult>;
  isArchiving: boolean;
  error: string | null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useArchiveClass(): UseArchiveClassReturn {
  const { pb } = useAuth();
  const [isArchiving, setIsArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const archiveClass = useCallback(
    async (classId: string): Promise<ArchiveResult> => {
      setIsArchiving(true);
      setError(null);

      try {
        const result = await pb.send(`/api/classes/${classId}/archive`, {
          method: 'POST',
        }) as ArchiveResult;

        return result;
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : 'Klasse konnte nicht archiviert werden.';
        setError(message);
        throw err;
      } finally {
        setIsArchiving(false);
      }
    },
    [pb],
  );

  return { archiveClass, isArchiving, error };
}
