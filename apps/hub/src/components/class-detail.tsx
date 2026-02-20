import { useState, useEffect } from 'react';
import { useAuth } from '@lernplattform/shared';
import type { Class, User } from '@lernplattform/shared';
import { ArchiveClassDialog } from './archive-class-dialog';
import { useArchiveClass } from '../hooks/use-archive-class';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ClassDetailProps {
  classId: string;
  onBack: () => void;
  onSelectStudent?: (studentId: string) => void;
  onArchived?: () => void;
}

interface DetailState {
  classData: Class | null;
  students: User[];
  isLoading: boolean;
  error: string | null;
  copied: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ClassDetail({ classId, onBack, onSelectStudent, onArchived }: ClassDetailProps) {
  const { pb } = useAuth();
  const { archiveClass, isArchiving } = useArchiveClass();

  const [state, setState] = useState<DetailState>({
    classData: null,
    students: [],
    isLoading: true,
    error: null,
    copied: false,
  });

  const [showArchiveDialog, setShowArchiveDialog] = useState(false);

  useEffect(() => {
    let stale = false;

    async function loadData() {
      try {
        const [classData, students] = await Promise.all([
          pb.collection('classes').getOne<Class>(classId),
          pb.collection('users').getFullList<User>({
            filter: `class_id = "${classId}"`,
            sort: 'username',
          }),
        ]);

        if (!stale) {
          setState((prev) => ({ ...prev, classData, students, isLoading: false }));
        }
      } catch {
        if (!stale) {
          setState((prev) => ({
            ...prev,
            error: 'Klasse konnte nicht geladen werden.',
            isLoading: false,
          }));
        }
      }
    }

    loadData();
    return () => {
      stale = true;
    };
  }, [classId, pb]);

  async function handleCopyCode() {
    if (!state.classData) return;
    try {
      await navigator.clipboard.writeText(state.classData.join_code);
      setState((prev) => ({ ...prev, copied: true }));
      setTimeout(() => setState((prev) => ({ ...prev, copied: false })), 2000);
    } catch {
      // Clipboard API not available — silently ignore
    }
  }

  async function handleArchiveConfirm() {
    await archiveClass(classId);
    setShowArchiveDialog(false);
    onArchived?.();
    onBack();
  }

  const isActive = state.classData?.is_active !== false;

  return (
    <section aria-labelledby="class-detail-heading">
      <div className="mb-6 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          aria-label="Zurück zur Klassen-Liste"
        >
          <span aria-hidden="true">←</span> Zurück
        </button>

        {!state.isLoading && !state.error && state.classData && isActive && (
          <button
            type="button"
            onClick={() => setShowArchiveDialog(true)}
            disabled={isArchiving}
            aria-label={`Klasse ${state.classData.name} archivieren`}
            className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Klasse archivieren
          </button>
        )}
      </div>

      {state.isLoading && (
        <div role="status" aria-live="polite" aria-busy="true" className="py-8 text-center text-gray-500 text-sm">
          <span>Daten werden geladen…</span>
        </div>
      )}

      {state.error && (
        <div role="alert" aria-live="assertive" className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {state.error}
        </div>
      )}

      {!state.isLoading && !state.error && state.classData && (
        <>
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center gap-3">
            <div>
              <h2 id="class-detail-heading" className="text-xl font-semibold text-gray-800 mb-1">
                {state.classData.name}
              </h2>
              <p className="text-gray-500 text-sm">{state.classData.school_year}</p>
            </div>
            {!isActive && (
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200"
                aria-label="Klasse archiviert"
              >
                Archiviert
              </span>
            )}
          </div>

          {/* Class Code Display — only for active classes */}
          {isActive && (
            <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm font-medium text-blue-700 mb-3">Klassen-Code (zum Teilen mit Schülern)</p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <span
                  className="font-mono text-4xl font-bold text-blue-900 tracking-[0.5em] select-all"
                  aria-label={`Klassen-Code: ${state.classData.join_code}`}
                >
                  {state.classData.join_code}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  aria-label={state.copied ? 'Klassen-Code kopiert' : 'Klassen-Code kopieren'}
                  aria-pressed={state.copied}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  {state.copied ? '✓ Kopiert!' : 'Code kopieren'}
                </button>
              </div>
            </div>
          )}

          {/* Student List — only for active classes */}
          {isActive ? (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Schüler ({state.students.length})
              </h3>

              {state.students.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-gray-500 text-sm">Noch keine Schüler in dieser Klasse.</p>
                  <p className="text-gray-500 text-xs mt-1">
                    Schüler treten der Klasse bei, indem sie sich mit dem Klassen-Code registrieren.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th scope="col" className="text-left py-2 pr-4 font-medium text-gray-700">
                          Benutzername
                        </th>
                        <th scope="col" className="text-left py-2 font-medium text-gray-700">
                          Anzeigename
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.students.map((student) => (
                        <tr
                          key={student.id}
                          className={[
                            'border-b border-gray-100',
                            onSelectStudent ? 'hover:bg-blue-50 cursor-pointer' : 'hover:bg-gray-50',
                          ].join(' ')}
                          onClick={onSelectStudent ? () => onSelectStudent(student.id) : undefined}
                        >
                          <td className="py-3 pr-4">
                            {onSelectStudent ? (
                              <button
                                type="button"
                                onClick={() => onSelectStudent(student.id)}
                                className="font-medium text-blue-600 hover:text-blue-800 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                                aria-label={`Schüler ${student.username} öffnen`}
                              >
                                {student.username}
                              </button>
                            ) : (
                              <span className="font-medium text-gray-900">{student.username}</span>
                            )}
                          </td>
                          <td className="py-3 text-gray-600">{student.display_name || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-gray-500 text-sm">
                Diese Klasse wurde archiviert. Schüler-Daten wurden gemäß DSGVO gelöscht.
              </p>
            </div>
          )}
        </>
      )}

      {/* Archive Confirmation Dialog */}
      {state.classData && (
        <ArchiveClassDialog
          className={state.classData.name}
          schoolYear={state.classData.school_year}
          studentCount={state.students.length}
          isOpen={showArchiveDialog}
          onConfirm={handleArchiveConfirm}
          onCancel={() => setShowArchiveDialog(false)}
        />
      )}
    </section>
  );
}
