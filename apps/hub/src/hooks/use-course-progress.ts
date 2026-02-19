import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@lernplattform/shared';
import type { SiteConfig } from '../config/sites';

export interface CourseProgressItem {
  courseSlug: string;
  completedExercises: number;
  totalExercises: number;
  percentage: number;
}

export interface UseCourseProgressReturn {
  progress: Map<string, CourseProgressItem>;
  isLoading: boolean;
}

interface ProgressRecord {
  course: string;
  lesson: string;
}

/**
 * Fetches progress data for all courses in a single bulk query.
 * Returns a map from course slug → CourseProgressItem.
 *
 * In guest mode (not logged in): returns empty map, no API call.
 * Temporary workaround: uses totalExercises from SiteConfig until REQ-037 (Manifest) is done.
 */
export function useCourseProgress(sites: SiteConfig[]): UseCourseProgressReturn {
  const { isLoggedIn, user, pb } = useAuth();
  const [progress, setProgress] = useState<Map<string, CourseProgressItem>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  // Stable key to avoid infinite loops from array identity changes
  const siteSlugsKey = sites.map((s) => s.slug).join(',');
  // Keep current sites accessible inside useEffect without re-triggering it
  const sitesRef = useRef(sites);
  sitesRef.current = sites;

  useEffect(() => {
    if (!isLoggedIn || !user) {
      setProgress(new Map());
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    pb.collection('progress')
      .getFullList<ProgressRecord>({
        filter: `user_id = "${user.id}" && status = "completed"`,
        fields: 'course,lesson',
      })
      .then((records) => {
        if (cancelled) return;

        // Group completed lessons by course (unique lesson per course)
        const completedBySlug = new Map<string, Set<string>>();
        for (const record of records) {
          if (!completedBySlug.has(record.course)) {
            completedBySlug.set(record.course, new Set());
          }
          completedBySlug.get(record.course)!.add(record.lesson);
        }

        // Build progress map for all sites
        const result = new Map<string, CourseProgressItem>();
        for (const site of sitesRef.current) {
          const completed = completedBySlug.get(site.slug)?.size ?? 0;
          const total = site.totalExercises;
          const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
          result.set(site.slug, {
            courseSlug: site.slug,
            completedExercises: completed,
            totalExercises: total,
            percentage,
          });
        }

        setProgress(result);
        setIsLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setProgress(new Map());
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, user?.id, pb, siteSlugsKey]);

  return { progress, isLoading };
}
