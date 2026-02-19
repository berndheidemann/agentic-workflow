// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ModuleUnlockList } from './module-unlock-list';
import type { ModuleConfig } from '../config/sites';
import type { ModuleUnlockState, ModuleStatus } from '../hooks/use-module-unlocks';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const moduleConfigs: ModuleConfig[] = [
  { id: 'modul-1', name: 'Grundlagen', sortOrder: 1 },
  { id: 'modul-2', name: 'Vertiefung', sortOrder: 2 },
  { id: 'modul-3', name: 'Praxis', sortOrder: 3 },
];

function makeModules(statuses: ModuleStatus[]): ModuleUnlockState[] {
  return statuses.map((status, i) => ({
    moduleId: `modul-${i + 1}`,
    status,
    recordId: status === 'locked' ? `rec-${i + 1}` : null,
  }));
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ModuleUnlockList', () => {
  it('zeigt Lade-Skeleton wenn isLoading=true', () => {
    render(
      <ModuleUnlockList
        modules={[]}
        moduleConfigs={[]}
        isSaving={false}
        isLoading={true}
        error={null}
        onToggle={vi.fn()}
        onUnlockUpTo={vi.fn()}
      />,
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/geladen/i)).toBeInTheDocument();
  });

  it('zeigt Fehler-Alert bei error', () => {
    render(
      <ModuleUnlockList
        modules={[]}
        moduleConfigs={[]}
        isSaving={false}
        isLoading={false}
        error="Verbindungsfehler"
        onToggle={vi.fn()}
        onUnlockUpTo={vi.fn()}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Verbindungsfehler');
  });

  it('zeigt Hinweistext wenn modules leer', () => {
    render(
      <ModuleUnlockList
        modules={[]}
        moduleConfigs={[]}
        isSaving={false}
        isLoading={false}
        error={null}
        onToggle={vi.fn()}
        onUnlockUpTo={vi.fn()}
      />,
    );
    expect(screen.getByText(/Keine Module/i)).toBeInTheDocument();
  });

  it('rendert alle Module mit korrektem Status', () => {
    const modules = makeModules(['unlocked', 'locked', 'unlocked']);
    render(
      <ModuleUnlockList
        modules={modules}
        moduleConfigs={moduleConfigs}
        isSaving={false}
        isLoading={false}
        error={null}
        onToggle={vi.fn()}
        onUnlockUpTo={vi.fn()}
      />,
    );

    expect(screen.getByText('Grundlagen')).toBeInTheDocument();
    expect(screen.getByText('Vertiefung')).toBeInTheDocument();
    expect(screen.getByText('Praxis')).toBeInTheDocument();
    expect(screen.getAllByText('(Freigeschaltet)').length).toBeGreaterThan(0);
    expect(screen.getAllByText('(Gesperrt)').length).toBeGreaterThan(0);
  });

  it('zeigt Toggle-Buttons mit korrektem Label', () => {
    const modules = makeModules(['unlocked', 'locked']);
    render(
      <ModuleUnlockList
        modules={modules}
        moduleConfigs={moduleConfigs}
        isSaving={false}
        isLoading={false}
        error={null}
        onToggle={vi.fn()}
        onUnlockUpTo={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /Modul "Grundlagen" sperren/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Modul "Vertiefung" freischalten/i })).toBeInTheDocument();
  });

  it('ruft onToggle mit moduleId auf', async () => {
    const onToggle = vi.fn();
    const modules = makeModules(['unlocked']);
    render(
      <ModuleUnlockList
        modules={modules}
        moduleConfigs={moduleConfigs}
        isSaving={false}
        isLoading={false}
        error={null}
        onToggle={onToggle}
        onUnlockUpTo={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Modul "Grundlagen" sperren/i }));
    expect(onToggle).toHaveBeenCalledWith('modul-1');
  });

  it('zeigt Bulk-Action Button "Bis hier freischalten"', () => {
    const modules = makeModules(['unlocked', 'locked']);
    render(
      <ModuleUnlockList
        modules={modules}
        moduleConfigs={moduleConfigs}
        isSaving={false}
        isLoading={false}
        error={null}
        onToggle={vi.fn()}
        onUnlockUpTo={vi.fn()}
      />,
    );

    const bulkButtons = screen.getAllByText('Bis hier freischalten');
    expect(bulkButtons).toHaveLength(2);
  });

  it('ruft onUnlockUpTo mit moduleId auf', async () => {
    const onUnlockUpTo = vi.fn();
    const modules = makeModules(['unlocked', 'locked']);
    render(
      <ModuleUnlockList
        modules={modules}
        moduleConfigs={moduleConfigs}
        isSaving={false}
        isLoading={false}
        error={null}
        onToggle={vi.fn()}
        onUnlockUpTo={onUnlockUpTo}
      />,
    );

    const bulkButtons = screen.getAllByRole('button', { name: /Alle Module bis einschließlich/i });
    fireEvent.click(bulkButtons[1]); // Click on the second module's bulk button
    expect(onUnlockUpTo).toHaveBeenCalledWith('modul-2');
  });

  it('deaktiviert Buttons wenn isSaving=true', () => {
    const modules = makeModules(['unlocked']);
    render(
      <ModuleUnlockList
        modules={modules}
        moduleConfigs={moduleConfigs}
        isSaving={true}
        isLoading={false}
        error={null}
        onToggle={vi.fn()}
        onUnlockUpTo={vi.fn()}
      />,
    );

    const buttons = screen.getAllByRole('button');
    for (const button of buttons) {
      expect(button).toBeDisabled();
    }
  });

  it('hat aria-pressed auf Toggle-Button', () => {
    const modules = makeModules(['unlocked', 'locked']);
    render(
      <ModuleUnlockList
        modules={modules}
        moduleConfigs={moduleConfigs}
        isSaving={false}
        isLoading={false}
        error={null}
        onToggle={vi.fn()}
        onUnlockUpTo={vi.fn()}
      />,
    );

    const unlockBtn = screen.getByRole('button', { name: /Modul "Grundlagen" sperren/i });
    const lockBtn = screen.getByRole('button', { name: /Modul "Vertiefung" freischalten/i });
    expect(unlockBtn).toHaveAttribute('aria-pressed', 'true');
    expect(lockBtn).toHaveAttribute('aria-pressed', 'false');
  });

  // ─── completed state tests ────────────────────────────────────────────────

  it('zeigt "Abgeschlossen"-Status korrekt an', () => {
    const modules = makeModules(['completed']);
    render(
      <ModuleUnlockList
        modules={modules}
        moduleConfigs={moduleConfigs}
        isSaving={false}
        isLoading={false}
        error={null}
        onToggle={vi.fn()}
        onUnlockUpTo={vi.fn()}
      />,
    );

    expect(screen.getByText('(Abgeschlossen)')).toBeInTheDocument();
  });

  it('zeigt "Sperren"-Button bei completed-Modul', () => {
    const modules = makeModules(['completed']);
    render(
      <ModuleUnlockList
        modules={modules}
        moduleConfigs={moduleConfigs}
        isSaving={false}
        isLoading={false}
        error={null}
        onToggle={vi.fn()}
        onUnlockUpTo={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /Modul "Grundlagen" sperren/i })).toBeInTheDocument();
  });

  it('aria-pressed ist true fuer completed-Modul (weil freigeschaltet)', () => {
    const modules = makeModules(['completed']);
    render(
      <ModuleUnlockList
        modules={modules}
        moduleConfigs={moduleConfigs}
        isSaving={false}
        isLoading={false}
        error={null}
        onToggle={vi.fn()}
        onUnlockUpTo={vi.fn()}
      />,
    );

    const btn = screen.getByRole('button', { name: /Modul "Grundlagen" sperren/i });
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });

  it('zeigt alle drei Zustaende gleichzeitig sichtbar', () => {
    const modules = makeModules(['unlocked', 'locked', 'completed']);
    render(
      <ModuleUnlockList
        modules={modules}
        moduleConfigs={moduleConfigs}
        isSaving={false}
        isLoading={false}
        error={null}
        onToggle={vi.fn()}
        onUnlockUpTo={vi.fn()}
      />,
    );

    expect(screen.getByText('(Freigeschaltet)')).toBeInTheDocument();
    expect(screen.getByText('(Gesperrt)')).toBeInTheDocument();
    expect(screen.getByText('(Abgeschlossen)')).toBeInTheDocument();
  });
});
