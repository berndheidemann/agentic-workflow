import { useState, useEffect, useRef } from 'react';
import type { CourseManifest } from '@lernplattform/shared';
import { validateManifest } from '@lernplattform/shared';
import type { SiteConfig } from '../config/sites';

export interface UseManifestsReturn {
  manifests: Map<string, CourseManifest>;
  isLoading: boolean;
  getManifest: (courseSlug: string) => CourseManifest | null;
}

/**
 * Fetches course-manifest.json for each active site.
 * The manifest is served as a static file from each site's build output.
 *
 * Returns a map from course slug → CourseManifest.
 * Sites without a manifest (not yet built / fetch failed) are excluded from the map.
 */
export function useManifests(sites: SiteConfig[]): UseManifestsReturn {
  const [manifests, setManifests] = useState<Map<string, CourseManifest>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  const siteSlugsKey = sites.map((s) => s.slug).join(',');
  const sitesRef = useRef(sites);
  sitesRef.current = sites;

  useEffect(() => {
    if (sites.length === 0) {
      setManifests(new Map());
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const fetchAll = sites.map((site) =>
      fetch(`${site.basePath}course-manifest.json`)
        .then((res) => {
          if (!res.ok) return null;
          return res.json() as Promise<unknown>;
        })
        .then((data) => {
          const manifest = validateManifest(data);
          return manifest ? { slug: site.slug, manifest } : null;
        })
        .catch(() => null)
    );

    Promise.all(fetchAll).then((results) => {
      if (cancelled) return;
      const map = new Map<string, CourseManifest>();
      for (const result of results) {
        if (result) map.set(result.slug, result.manifest);
      }
      setManifests(map);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteSlugsKey]);

  // getManifest reads from the current manifests state each call.
  // Defined inline so it always has the latest manifests reference.
  function getManifest(courseSlug: string): CourseManifest | null {
    return manifests.get(courseSlug) ?? null;
  }

  return { manifests, isLoading, getManifest };
}
