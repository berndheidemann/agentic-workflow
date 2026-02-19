import { useState, useEffect } from 'react';

export interface ModuleConfig {
  id: string;
  name: string;
  sortOrder: number;
}

export interface SiteConfig {
  slug: string;
  name: string;
  description: string;
  /** SVG path data (d attribute) for the site icon */
  icon: string;
  basePath: string;
  frameworkType: 'starlight' | 'react-spa';
  isActive: boolean;
  sortOrder: number;
  /** Modules for this course. Placeholder until REQ-037 manifests provide real data. */
  modules: ModuleConfig[];
  /**
   * Total number of exercises in this course.
   * Manually maintained until REQ-037 (Manifest) provides real data.
   * Used for progress percentage calculation in course cards.
   */
  totalExercises: number;
}

// ─── JSON shape (snake_case, matches sites.json) ──────────────────────────────

interface ModuleJson {
  id: string;
  name: string;
  sort_order: number;
}

interface SiteJson {
  slug: string;
  name: string;
  description: string;
  icon: string;
  base_path: string;
  framework_type: 'starlight' | 'react-spa';
  is_active: boolean;
  sort_order: number;
  total_exercises: number;
  modules: ModuleJson[];
}

interface SitesJson {
  version: number;
  sites: SiteJson[];
}

// ─── Conversion ───────────────────────────────────────────────────────────────

function siteFromJson(raw: SiteJson): SiteConfig {
  return {
    slug: raw.slug,
    name: raw.name,
    description: raw.description,
    icon: raw.icon,
    basePath: raw.base_path,
    frameworkType: raw.framework_type,
    isActive: raw.is_active,
    sortOrder: raw.sort_order,
    totalExercises: raw.total_exercises ?? 0,
    modules: raw.modules.map((m) => ({
      id: m.id,
      name: m.name,
      sortOrder: m.sort_order,
    })),
  };
}

// ─── Async loader (Single Source of Truth: public/sites.json) ─────────────────

/**
 * Fetch sites from public/sites.json (the canonical registry).
 * Falls back to the static array if the fetch fails (e.g. offline, test env).
 */
export async function getSites(): Promise<SiteConfig[]> {
  try {
    const response = await fetch('/sites.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as SitesJson;
    return data.sites.map(siteFromJson);
  } catch {
    // Fallback to static list (ensures app works without network in dev/test)
    return sites;
  }
}

/**
 * React hook that loads sites from the registry and returns them sorted/filtered.
 * Starts with the static list so the UI renders immediately (no loading flash).
 */
export function useSites(): { sites: SiteConfig[]; isLoading: boolean } {
  const [loadedSites, setLoadedSites] = useState<SiteConfig[]>(getActiveSites());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getSites()
      .then((result) => {
        if (!cancelled) {
          setLoadedSites(result.filter((s) => s.isActive).sort((a, b) => a.sortOrder - b.sortOrder));
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { sites: loadedSites, isLoading };
}

// ─── Static fallback (Heroicons MIT License — https://github.com/tailwindlabs/heroicons) ──
// clipboard-document-check, table-cells, globe-alt, puzzle-piece, calculator, rectangle-group
// This array is the fallback when sites.json cannot be fetched.
// The canonical data lives in public/sites.json — keep both in sync!
export const sites: SiteConfig[] = [
  {
    slug: 'ap1',
    name: 'AP1-Trainer',
    description: 'Abschlussprüfung Teil 1',
    icon: 'M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75',
    basePath: '/ap1/',
    frameworkType: 'starlight',
    isActive: true,
    sortOrder: 1,
    totalExercises: 120,
    modules: [
      { id: 'wirtschaft', name: 'Wirtschaft & Recht', sortOrder: 1 },
      { id: 'it-systeme', name: 'IT-Systeme', sortOrder: 2 },
      { id: 'netzwerke', name: 'Netzwerktechnik', sortOrder: 3 },
      { id: 'programmierung', name: 'Programmierung', sortOrder: 4 },
      { id: 'datenbanken', name: 'Datenbanken', sortOrder: 5 },
    ],
  },
  {
    slug: 'pandas',
    name: 'Pandas',
    description: 'Datenanalyse mit Python',
    icon: 'M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75.125v-5.25c0-.621.504-1.125 1.125-1.125H6.75m0 0V15m0-2.625h-.375c-.621 0-1.125.504-1.125 1.125V15m0 0h.375m0 0h10.875m0 0h.375m0 0v-2.625c0-.621-.504-1.125-1.125-1.125H16.5m0 0V15m4.125-2.625H16.5m0 0V9.375c0-.621-.504-1.125-1.125-1.125H9.375c-.621 0-1.125.504-1.125 1.125V15m7.5-5.625V6.375c0-.621-.504-1.125-1.125-1.125H9.375c-.621 0-1.125.504-1.125 1.125v3m7.5 0H9.375',
    basePath: '/pandas/',
    frameworkType: 'starlight',
    isActive: true,
    sortOrder: 2,
    totalExercises: 40,
    modules: [
      { id: 'grundlagen', name: 'Grundlagen', sortOrder: 1 },
      { id: 'dataframes', name: 'DataFrames', sortOrder: 2 },
      { id: 'analyse', name: 'Datenanalyse', sortOrder: 3 },
      { id: 'visualisierung', name: 'Visualisierung', sortOrder: 4 },
    ],
  },
  {
    slug: 'rest',
    name: 'REST & NoSQL',
    description: 'Web-APIs und Datenbanken',
    icon: 'M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418',
    basePath: '/rest/',
    frameworkType: 'starlight',
    isActive: true,
    sortOrder: 3,
    totalExercises: 35,
    modules: [
      { id: 'rest-grundlagen', name: 'REST Grundlagen', sortOrder: 1 },
      { id: 'http-methoden', name: 'HTTP-Methoden', sortOrder: 2 },
      { id: 'nosql', name: 'NoSQL-Datenbanken', sortOrder: 3 },
      { id: 'api-design', name: 'API-Design', sortOrder: 4 },
    ],
  },
  {
    slug: 'zuul',
    name: 'World of Zuul',
    description: 'Objektorientierte Programmierung',
    icon: 'M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 0 1-.657.643 48.39 48.39 0 0 1-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 0 1-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 0 0-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 0 1-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 0 0 .657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 0 1-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 0 0 5.427-.63 48.05 48.05 0 0 0 .582-4.717.532.532 0 0 0-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.959.401v0a.656.656 0 0 0 .658-.663 48.422 48.422 0 0 0-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 0 1-.61-.58v0Z',
    basePath: '/zuul/',
    frameworkType: 'starlight',
    isActive: true,
    sortOrder: 4,
    totalExercises: 30,
    modules: [
      { id: 'einfuehrung', name: 'Einführung', sortOrder: 1 },
      { id: 'klassen', name: 'Klassen & Objekte', sortOrder: 2 },
      { id: 'vererbung', name: 'Vererbung', sortOrder: 3 },
      { id: 'entwurfsmuster', name: 'Entwurfsmuster', sortOrder: 4 },
    ],
  },
  {
    slug: 'numpy',
    name: 'NumPy',
    description: 'Numerik mit Python',
    icon: 'M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V13.5Zm0 2.25h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V18Zm2.498-6.75h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V13.5Zm0 2.25h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V18Zm2.504-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5Zm0 2.25h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V18Zm2.498-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5ZM8.25 6h7.5v2.25h-7.5V6ZM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 0 0 2.25 2.25h10.5a2.25 2.25 0 0 0 2.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0 0 12 2.25Z',
    basePath: '/numpy/',
    frameworkType: 'react-spa',
    isActive: true,
    sortOrder: 5,
    totalExercises: 25,
    modules: [
      { id: 'arrays', name: 'Arrays & Vektoren', sortOrder: 1 },
      { id: 'operationen', name: 'Operationen', sortOrder: 2 },
      { id: 'lineare-algebra', name: 'Lineare Algebra', sortOrder: 3 },
    ],
  },
  {
    slug: 'uml',
    name: 'UML',
    description: 'Softwaremodellierung',
    icon: 'M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 0 1-1.125-1.125v-3.75ZM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 0 1-1.125-1.125v-8.25ZM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 0 1-1.125-1.125v-2.25Z',
    basePath: '/uml/',
    frameworkType: 'react-spa',
    isActive: true,
    sortOrder: 6,
    totalExercises: 30,
    modules: [
      { id: 'klassendiagramme', name: 'Klassendiagramme', sortOrder: 1 },
      { id: 'sequenzdiagramme', name: 'Sequenzdiagramme', sortOrder: 2 },
      { id: 'aktivitaetsdiagramme', name: 'Aktivitätsdiagramme', sortOrder: 3 },
      { id: 'anwendungsfalldiagramme', name: 'Anwendungsfalldiagramme', sortOrder: 4 },
    ],
  },
];

export function getActiveSites(): SiteConfig[] {
  return sites.filter((s) => s.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
}
