import { describe, it, expect } from 'vitest';
import { manifestToColumns, manifestToModuleOptions } from './use-manifest-columns';
import type { CourseManifest } from '@lernplattform/shared';

function makeManifest(): CourseManifest {
  return {
    version: 1,
    course: 'ap1',
    name: 'AP1-Trainer',
    generatedAt: '2026-02-19T00:00:00.000Z',
    totalExercises: 3,
    modules: [
      {
        id: 'netzwerktechnik',
        title: 'Netzwerktechnik',
        sortOrder: 1,
        lessons: [
          {
            slug: 'netzwerktechnik/ip-adressierung',
            title: 'IP-Adressierung',
            exercises: [
              { id: 'netzwerktechnik-ip-adressierung-01', title: 'IP-Klassen', type: 'DragDrop', points: 6, difficulty: 1 },
              { id: 'netzwerktechnik-ip-adressierung-02', title: 'DHCP-Prozess', type: 'DragDrop', points: 4, difficulty: 1 },
            ],
          },
        ],
      },
      {
        id: 'datenbanken',
        title: 'Datenbanken',
        sortOrder: 2,
        lessons: [
          {
            slug: 'datenbanken/er-modell',
            title: 'ER-Modell',
            exercises: [
              { id: 'datenbanken-er-modell-01', title: 'ER-Diagramm', type: 'MultipleChoice', points: 3, difficulty: 2 },
            ],
          },
        ],
      },
    ],
  };
}

describe('manifestToColumns', () => {
  it('gibt alle Spalten in Manifest-Reihenfolge zurück', () => {
    const columns = manifestToColumns(makeManifest());
    expect(columns).toHaveLength(3);
    expect(columns[0].exercise).toBe('netzwerktechnik-ip-adressierung-01');
    expect(columns[1].exercise).toBe('netzwerktechnik-ip-adressierung-02');
    expect(columns[2].exercise).toBe('datenbanken-er-modell-01');
  });

  it('setzt lesson auf den Lektion-Slug', () => {
    const columns = manifestToColumns(makeManifest());
    expect(columns[0].lesson).toBe('netzwerktechnik/ip-adressierung');
    expect(columns[2].lesson).toBe('datenbanken/er-modell');
  });

  it('setzt label auf den Exercise-Titel', () => {
    const columns = manifestToColumns(makeManifest());
    expect(columns[0].label).toBe('IP-Klassen');
    expect(columns[2].label).toBe('ER-Diagramm');
  });

  it('filtert nach Modul wenn moduleFilter gesetzt', () => {
    const columns = manifestToColumns(makeManifest(), 'datenbanken');
    expect(columns).toHaveLength(1);
    expect(columns[0].exercise).toBe('datenbanken-er-modell-01');
  });

  it('gibt alle Spalten zurück wenn moduleFilter null', () => {
    const columns = manifestToColumns(makeManifest(), null);
    expect(columns).toHaveLength(3);
  });

  it('gibt leeres Array für leeres Manifest', () => {
    const emptyManifest: CourseManifest = {
      version: 1,
      course: 'test',
      name: 'Test',
      generatedAt: '',
      modules: [],
      totalExercises: 0,
    };
    expect(manifestToColumns(emptyManifest)).toHaveLength(0);
  });

  it('unbekannter moduleFilter gibt leeres Array', () => {
    const columns = manifestToColumns(makeManifest(), 'unbekannt');
    expect(columns).toHaveLength(0);
  });
});

describe('manifestToModuleOptions', () => {
  it('gibt Module in Reihenfolge zurück', () => {
    const options = manifestToModuleOptions(makeManifest());
    expect(options).toHaveLength(2);
    expect(options[0]).toEqual({ id: 'netzwerktechnik', title: 'Netzwerktechnik' });
    expect(options[1]).toEqual({ id: 'datenbanken', title: 'Datenbanken' });
  });

  it('gibt leeres Array für Manifest ohne Module', () => {
    const m: CourseManifest = { ...makeManifest(), modules: [] };
    expect(manifestToModuleOptions(m)).toHaveLength(0);
  });
});
