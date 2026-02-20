import { describe, it, expect } from 'vitest';
import { validateManifest } from './index';
import type { CourseManifest } from './types';

function makeValidManifest(): CourseManifest {
  return {
    version: 1,
    course: 'ap1',
    name: 'AP1-Trainer',
    generatedAt: '2026-02-19T00:00:00.000Z',
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
              {
                id: 'netzwerktechnik-ip-adressierung-01',
                title: 'IP-Klassen und Bereiche',
                type: 'DragDropExercise',
                points: 6,
                difficulty: 1,
              },
            ],
          },
        ],
      },
    ],
    totalExercises: 1,
  };
}

describe('validateManifest', () => {
  it('gibt gültiges Manifest zurück', () => {
    const manifest = makeValidManifest();
    const result = validateManifest(manifest);
    expect(result).not.toBeNull();
    expect(result?.course).toBe('ap1');
    expect(result?.version).toBe(1);
  });

  it('null bei null-Input', () => {
    expect(validateManifest(null)).toBeNull();
  });

  it('null bei undefined-Input', () => {
    expect(validateManifest(undefined)).toBeNull();
  });

  it('null bei falschem version-Wert', () => {
    const data = { ...makeValidManifest(), version: 2 };
    expect(validateManifest(data)).toBeNull();
  });

  it('null wenn course fehlt', () => {
    const data = { ...makeValidManifest(), course: '' };
    expect(validateManifest(data)).toBeNull();
  });

  it('null wenn name fehlt', () => {
    const data = { ...makeValidManifest(), name: '' };
    expect(validateManifest(data)).toBeNull();
  });

  it('null wenn modules kein Array ist', () => {
    const data = { ...makeValidManifest(), modules: 'wrong' };
    expect(validateManifest(data)).toBeNull();
  });

  it('null wenn totalExercises keine Zahl ist', () => {
    const data = { ...makeValidManifest(), totalExercises: 'wrong' };
    expect(validateManifest(data)).toBeNull();
  });

  it('null bei String-Input', () => {
    expect(validateManifest('not an object')).toBeNull();
  });

  it('null bei Number-Input', () => {
    expect(validateManifest(42)).toBeNull();
  });

  it('akzeptiert Manifest mit leeren Modulen', () => {
    const data = { ...makeValidManifest(), modules: [], totalExercises: 0 };
    const result = validateManifest(data);
    expect(result).not.toBeNull();
    expect(result?.totalExercises).toBe(0);
  });
});
