import { useEffect, useState } from 'react';
import { useAuth } from '../auth/use-auth';
import { COLLECTION_PROGRESS } from '../schema/collections';
import type { Progress } from '../schema/collections';
import type { PrerequisiteInfo, UsePrerequisitesReturn } from './types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Converts a kebab-case lesson slug to a human-readable display name.
 * e.g. "ip-adressierung" → "IP-Adressierung", "osi-modell" → "OSI-Modell"
 */
export function toDisplayName(lessonSlug: string): string {
  const parts = lessonSlug.split('/');
  const lastSegment = parts[parts.length - 1] ?? lessonSlug;
  return lastSegment
    .split('-')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('-');
}

/**
 * Builds the href for a prerequisite page given the site base path and lesson path.
 * e.g. basePath="/ap1/", lessonPath="netzwerktechnik/ip-adressierung"
 * → "/ap1/netzwerktechnik/ip-adressierung/"
 */
export function buildPrerequisiteHref(basePath: string, lessonPath: string): string {
  const normalizedBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
  return `${normalizedBase}${lessonPath}/`;
}

/** Checks whether a given lessonPath is marked as completed in a list of progress records. */
function isCompleted(lessonPath: string, records: Progress[]): boolean {
  // The lesson field in progress records matches the last segment of the lesson path.
  // e.g. lessonPath "netzwerktechnik/ip-adressierung" → lesson = "netzwerktechnik/ip-adressierung"
  // as stored by parseUrlToCoursePath() which uses the full path after the course slug.
  return records.some((r) => r.lesson === lessonPath && r.status === 'completed');
}

// ─── Guest return value ───────────────────────────────────────────────────────

const GUEST_RETURN: UsePrerequisitesReturn = {
  unmet: [],
  isLoading: false,
  isGuest: true,
};

// ─── usePrerequisites ─────────────────────────────────────────────────────────

/**
 * Hook to check prerequisite completion for the current user.
 *
 * Must be used inside `<AuthProvider>`.
 *
 * - Guest mode: returns `isGuest: true`, `unmet: []` — no banner is shown.
 * - Logged in: queries the `progress` collection for completed lessons.
 * - Returns unmet prerequisites with display names and links.
 *
 * @param prerequisites - Array of lesson paths from frontmatter
 *   (e.g. `["netzwerktechnik/ip-adressierung"]`)
 * @param options.course - Course slug (e.g. "ap1"). Derived from URL if omitted.
 * @param options.basePath - Base URL path for the site (e.g. "/ap1/").
 *   Used to build hrefs. Derived from URL if omitted.
 */
export function usePrerequisites(
  prerequisites: string[],
  options?: { course?: string; basePath?: string }
): UsePrerequisitesReturn {
  const { isLoggedIn, user, pb, isLoading: authLoading } = useAuth();

  const [unmet, setUnmet] = useState<PrerequisiteInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // No prerequisites to check
    if (prerequisites.length === 0) {
      setUnmet([]);
      return;
    }

    // Guest mode: no check, no banner
    if (!isLoggedIn || !user || authLoading) {
      setUnmet([]);
      return;
    }

    // Derive course slug from URL or option
    const course =
      options?.course ??
      (() => {
        // URL format: /ap1/netzwerktechnik/subnetting/ → course = "ap1"
        const segments = window.location.pathname.split('/').filter(Boolean);
        return segments[0] ?? '';
      })();

    // Derive base path from URL or option
    const basePath = options?.basePath ?? (course ? `/${course}/` : '/');

    setIsLoading(true);

    void pb
      .collection(COLLECTION_PROGRESS)
      .getFullList<Progress>({
        filter: `user_id = "${user.id}" && course = "${course}"`,
        sort: 'lesson',
      })
      .then((records) => {
        const unmetPrereqs = prerequisites
          .filter((lessonPath) => lessonPath.trim() !== '')
          .filter((lessonPath) => !isCompleted(lessonPath, records))
          .map((lessonPath): PrerequisiteInfo => ({
            lessonPath,
            displayName: toDisplayName(lessonPath),
            href: buildPrerequisiteHref(basePath, lessonPath),
          }));

        setUnmet(unmetPrereqs);
      })
      .catch(() => {
        // On error: fail safe — show no banner rather than blocking the user
        setUnmet([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  // Dependencies: re-run when auth state or prerequisites change.
  // prerequisites.join(',') is used instead of the array reference for stable comparison.
  }, [isLoggedIn, user?.id, authLoading, prerequisites.join(','), options?.course, options?.basePath]);

  // Guest mode: stable return without any state
  if (!isLoggedIn || !user) {
    return GUEST_RETURN;
  }

  return { unmet, isLoading, isGuest: false };
}
