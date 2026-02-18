// ─── URL parser ───────────────────────────────────────────────────────────────

export interface ParsedUrl {
  /** First path segment (e.g. "ap1" from "/ap1/modul-1/lektion-2/"). */
  course: string;
  /** Remaining path segments joined with "/" (e.g. "modul-1/lektion-2"). */
  lesson: string;
}

/**
 * Parses a URL pathname and extracts course and lesson.
 *
 * Convention: first path segment = course (matches Nginx subpath),
 * remaining segments = lesson (joined with "/", no trailing slash).
 *
 * Examples:
 *   "/ap1/modul-1/lektion-2/" → { course: "ap1", lesson: "modul-1/lektion-2" }
 *   "/pandas/grundlagen/"     → { course: "pandas", lesson: "grundlagen" }
 *   "/numpy/"                 → { course: "numpy", lesson: "" }
 *   "/"                       → null
 *   ""                        → null
 *
 * @param pathname - URL path to parse. Defaults to window.location.pathname.
 * @returns Parsed course/lesson or null if the path has no course segment.
 */
export function parseUrlToCoursePath(pathname?: string): ParsedUrl | null {
  const path = pathname ?? (typeof window !== 'undefined' ? window.location.pathname : '/');

  // Split path into segments, filtering out empty strings from leading/trailing slashes
  const segments = path.split('/').filter((s) => s.length > 0);

  if (segments.length === 0) {
    return null;
  }

  const [course, ...rest] = segments;
  const lesson = rest.join('/');

  return { course, lesson };
}
