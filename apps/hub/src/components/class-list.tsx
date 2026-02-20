import type { Class } from '@lernplattform/shared';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ClassWithCount {
  classData: Class;
  studentCount: number;
}

export interface ClassListProps {
  classes: ClassWithCount[];
  isLoading: boolean;
  onSelectClass: (classId: string) => void;
  onCreateNew: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ClassList({ classes, isLoading, onSelectClass, onCreateNew }: ClassListProps) {
  // Sort: active classes first, archived at the end
  const sorted = [...classes].sort((a, b) => {
    const aActive = a.classData.is_active !== false;
    const bActive = b.classData.is_active !== false;
    if (aActive === bActive) return 0;
    return aActive ? -1 : 1;
  });

  return (
    <section aria-labelledby="klassen-heading">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 id="klassen-heading" className="text-xl font-semibold text-gray-800">
          Klassen
        </h2>
        <button
          type="button"
          onClick={onCreateNew}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          aria-label="Neue Klasse erstellen"
        >
          + Neue Klasse
        </button>
      </div>

      {isLoading && (
        <div role="status" aria-live="polite" aria-busy="true" className="py-8 text-center text-gray-500 text-sm">
          <span className="sr-only">Klassen werden geladen…</span>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </div>
      )}

      {!isLoading && classes.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-gray-500 text-sm mb-2">Noch keine Klassen angelegt.</p>
          <p className="text-gray-400 text-xs">Erstelle deine erste Klasse mit dem Button oben.</p>
        </div>
      )}

      {!isLoading && sorted.length > 0 && (
        <ul className="space-y-3" aria-label="Klassen-Liste">
          {sorted.map(({ classData, studentCount }) => {
            const isActive = classData.is_active !== false;
            return (
              <li key={classData.id}>
                <button
                  type="button"
                  onClick={() => onSelectClass(classData.id)}
                  className={[
                    'w-full text-left p-4 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors',
                    isActive
                      ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                      : 'border-gray-200 opacity-60 hover:opacity-80 hover:bg-gray-50',
                  ].join(' ')}
                  aria-label={
                    isActive
                      ? `Klasse ${classData.name} öffnen`
                      : `Archivierte Klasse ${classData.name} öffnen`
                  }
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={['font-medium', isActive ? 'text-gray-900' : 'text-gray-500'].join(' ')}>
                        {classData.name}
                      </span>
                      <span className="text-gray-500 text-sm">{classData.school_year}</span>
                      {!isActive && (
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200"
                          aria-label="Klasse archiviert"
                        >
                          Archiviert
                        </span>
                      )}
                    </div>
                    {isActive && (
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">
                          {studentCount} {studentCount === 1 ? 'Schüler' : 'Schüler'}
                        </span>
                        <span
                          className="font-mono text-sm font-semibold bg-gray-100 text-gray-800 px-3 py-1 rounded-md tracking-widest"
                          aria-label={`Klassen-Code: ${classData.join_code}`}
                        >
                          {classData.join_code}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
