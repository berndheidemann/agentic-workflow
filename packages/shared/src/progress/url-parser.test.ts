import { describe, it, expect } from 'vitest';
import { parseUrlToCoursePath } from './url-parser';

describe('parseUrlToCoursePath', () => {
  it('parses a full path into course and lesson', () => {
    expect(parseUrlToCoursePath('/ap1/modul-1/lektion-2/')).toEqual({
      course: 'ap1',
      lesson: 'modul-1/lektion-2',
    });
  });

  it('parses a path with one lesson segment', () => {
    expect(parseUrlToCoursePath('/pandas/grundlagen/')).toEqual({
      course: 'pandas',
      lesson: 'grundlagen',
    });
  });

  it('parses a path with only a course segment', () => {
    expect(parseUrlToCoursePath('/numpy/')).toEqual({
      course: 'numpy',
      lesson: '',
    });
  });

  it('returns null for root path', () => {
    expect(parseUrlToCoursePath('/')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseUrlToCoursePath('')).toBeNull();
  });

  it('parses a deeply nested path', () => {
    expect(parseUrlToCoursePath('/ap1/modul-1/lektion-2/aufgabe-3/')).toEqual({
      course: 'ap1',
      lesson: 'modul-1/lektion-2/aufgabe-3',
    });
  });

  it('handles path without trailing slash', () => {
    expect(parseUrlToCoursePath('/ap1/modul-1/lektion-2')).toEqual({
      course: 'ap1',
      lesson: 'modul-1/lektion-2',
    });
  });

  it('handles path without leading slash', () => {
    expect(parseUrlToCoursePath('ap1/modul-1')).toEqual({
      course: 'ap1',
      lesson: 'modul-1',
    });
  });
});
