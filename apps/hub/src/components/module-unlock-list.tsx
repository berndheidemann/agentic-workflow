import type { ModuleConfig } from '../config/sites';
import type { ModuleUnlockState } from '../hooks/use-module-unlocks';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ModuleUnlockListProps {
  modules: ModuleUnlockState[];
  moduleConfigs: ModuleConfig[];
  isSaving: boolean;
  isLoading: boolean;
  error: string | null;
  onToggle: (moduleId: string) => void;
  onUnlockUpTo: (moduleId: string) => void;
}

// ─── Status styling ──────────────────────────────────────────────────────────

const STATUS_STYLES = {
  unlocked: {
    bg: 'bg-green-50 border-green-200',
    icon: '🔓',
    label: 'Freigeschaltet',
    textColor: 'text-green-700',
    buttonLabel: 'Sperren',
    buttonStyle: 'bg-red-100 text-red-700 hover:bg-red-200 focus:ring-red-500',
  },
  locked: {
    bg: 'bg-red-50 border-red-200',
    icon: '🔒',
    label: 'Gesperrt',
    textColor: 'text-red-700',
    buttonLabel: 'Freischalten',
    buttonStyle: 'bg-green-100 text-green-700 hover:bg-green-200 focus:ring-green-500',
  },
} as const;

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className="animate-pulse space-y-3">
      <span className="sr-only">Freischaltungsdaten werden geladen…</span>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-gray-200 rounded" />
            <div className="w-32 h-5 bg-gray-200 rounded" />
          </div>
          <div className="w-24 h-8 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ModuleUnlockList({
  modules,
  moduleConfigs,
  isSaving,
  isLoading,
  error,
  onToggle,
  onUnlockUpTo,
}: ModuleUnlockListProps) {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div
        role="alert"
        className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm"
      >
        {error}
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <p className="text-gray-500 text-sm py-4">
        Keine Module vorhanden. Wähle eine Klasse und einen Kurs aus.
      </p>
    );
  }

  return (
    <div className="space-y-2" role="list" aria-label="Modul-Freischaltung">
      {modules.map((mod) => {
        const config = moduleConfigs.find((c) => c.id === mod.moduleId);
        const style = STATUS_STYLES[mod.status];
        const moduleName = config?.name ?? mod.moduleId;

        return (
          <div
            key={mod.moduleId}
            role="listitem"
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 border rounded-lg transition-colors ${style.bg}`}
          >
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="text-lg">{style.icon}</span>
              <div>
                <span className="font-medium text-gray-800">{moduleName}</span>
                <span className={`ml-2 text-xs ${style.textColor}`}>
                  ({style.label})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onUnlockUpTo(mod.moduleId)}
                disabled={isSaving}
                aria-label={`Alle Module bis einschließlich "${moduleName}" freischalten`}
                className="px-2 py-1 text-xs rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Bis hier freischalten
              </button>
              <button
                type="button"
                onClick={() => onToggle(mod.moduleId)}
                disabled={isSaving}
                aria-label={`Modul "${moduleName}" ${mod.status === 'unlocked' ? 'sperren' : 'freischalten'}`}
                aria-pressed={mod.status === 'unlocked'}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${style.buttonStyle}`}
              >
                {style.buttonLabel}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
