import { useState, useEffect } from 'react';
import { useAuth } from '@lernplattform/shared';
import type { Class, User } from '@lernplattform/shared';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ClassDetailProps {
  classId: string;
  onBack: () => void;
}

interface DetailState {
  classData: Class | null;
  students: User[];
  isLoading: boolean;
  error: string | null;
  copied: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ClassDetail({ classId, onBack }: ClassDetailProps) {
  const { pb } = useAuth();

  const [state, setState] = useState<DetailState>({
    classData: null,
    students: [],
    isLoading: true,
    error: null,
    copied: false,
  });

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

  return (
    <section aria-labelledby="class-detail-heading">
      <div className="mb-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          aria-label="Zurück zur Klassen-Liste"
        >
          ← Zurück
        </button>
      </div>

      {state.isLoading && (
        <div role="status" aria-live="polite" aria-busy="true" className="py-8 text-center text-gray-500 text-sm">
          <span>Daten werden geladen…</span>
        </div>
      )}

      {state.error && (
        <div role="alert" className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {state.error}
        </div>
      )}

      {!state.isLoading && !state.error && state.classData && (
        <>
          <div className="mb-8">
            <h2 id="class-detail-heading" className="text-xl font-semibold text-gray-800 mb-1">
              {state.classData.name}
            </h2>
            <p className="text-gray-500 text-sm">{state.classData.school_year}</p>
          </div>

          {/* Class Code Display */}
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
                aria-label="Klassen-Code kopieren"
                aria-live="polite"
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                {state.copied ? '✓ Kopiert!' : 'Code kopieren'}
              </button>
            </div>
          </div>

          {/* Student List */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Schüler ({state.students.length})
            </h3>

            {state.students.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-gray-500 text-sm">Noch keine Schüler in dieser Klasse.</p>
                <p className="text-gray-400 text-xs mt-1">
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
                      <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 pr-4 font-medium text-gray-900">{student.username}</td>
                        <td className="py-3 text-gray-600">{student.display_name || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
