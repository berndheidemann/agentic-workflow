import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClassList } from './class-list';
import type { ClassWithCount } from './class-list';
import type { Class } from '@lernplattform/shared';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeClass(overrides: Partial<Class> = {}): Class {
  return {
    id: 'cls-1',
    name: 'FI24a',
    join_code: 'ABCDEF',
    school_year: '2025/2026',
    is_active: true,
    created_by: 'teacher-1',
    created: '',
    updated: '',
    ...overrides,
  };
}

const sampleClasses: ClassWithCount[] = [
  { classData: makeClass({ id: 'cls-1', name: 'FI24a', join_code: 'ABCDEF' }), studentCount: 5 },
  { classData: makeClass({ id: 'cls-2', name: 'FI24b', join_code: 'GHIJKL' }), studentCount: 12 },
];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ClassList', () => {
  it('rendert Klassen-Namen', () => {
    render(
      <ClassList classes={sampleClasses} isLoading={false} onSelectClass={vi.fn()} onCreateNew={vi.fn()} />
    );
    expect(screen.getByText('FI24a')).toBeInTheDocument();
    expect(screen.getByText('FI24b')).toBeInTheDocument();
  });

  it('rendert Klassen-Codes', () => {
    render(
      <ClassList classes={sampleClasses} isLoading={false} onSelectClass={vi.fn()} onCreateNew={vi.fn()} />
    );
    expect(screen.getByText('ABCDEF')).toBeInTheDocument();
    expect(screen.getByText('GHIJKL')).toBeInTheDocument();
  });

  it('rendert Schüler-Anzahl', () => {
    render(
      <ClassList classes={sampleClasses} isLoading={false} onSelectClass={vi.fn()} onCreateNew={vi.fn()} />
    );
    expect(screen.getByText('5 Schüler')).toBeInTheDocument();
    expect(screen.getByText('12 Schüler')).toBeInTheDocument();
  });

  it('ruft onSelectClass mit korrekter classId', () => {
    const onSelectClass = vi.fn();
    render(
      <ClassList classes={sampleClasses} isLoading={false} onSelectClass={onSelectClass} onCreateNew={vi.fn()} />
    );
    fireEvent.click(screen.getByRole('button', { name: /FI24a öffnen/i }));
    expect(onSelectClass).toHaveBeenCalledWith('cls-1');
  });

  it('ruft onCreateNew bei "Neue Klasse" Button', () => {
    const onCreateNew = vi.fn();
    render(
      <ClassList classes={sampleClasses} isLoading={false} onSelectClass={vi.fn()} onCreateNew={onCreateNew} />
    );
    fireEvent.click(screen.getByRole('button', { name: /Neue Klasse erstellen/i }));
    expect(onCreateNew).toHaveBeenCalledTimes(1);
  });

  it('zeigt Lade-Skeleton bei isLoading=true', () => {
    render(
      <ClassList classes={[]} isLoading={true} onSelectClass={vi.fn()} onCreateNew={vi.fn()} />
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/Klassen werden geladen/i)).toBeInTheDocument();
  });

  it('zeigt Empty-State bei leerer Liste', () => {
    render(
      <ClassList classes={[]} isLoading={false} onSelectClass={vi.fn()} onCreateNew={vi.fn()} />
    );
    expect(screen.getByText(/Noch keine Klassen angelegt/i)).toBeInTheDocument();
  });

  it('rendert semantische Liste', () => {
    render(
      <ClassList classes={sampleClasses} isLoading={false} onSelectClass={vi.fn()} onCreateNew={vi.fn()} />
    );
    expect(screen.getByRole('list', { name: /Klassen-Liste/i })).toBeInTheDocument();
  });

  it('hat sichtbaren Klassen-Heading h2', () => {
    render(
      <ClassList classes={sampleClasses} isLoading={false} onSelectClass={vi.fn()} onCreateNew={vi.fn()} />
    );
    expect(screen.getByRole('heading', { name: 'Klassen', level: 2 })).toBeInTheDocument();
  });
});
