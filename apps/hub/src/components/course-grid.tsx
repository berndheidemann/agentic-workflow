import type { SiteConfig } from '../config/sites';
import type { CourseProgressItem } from '../hooks/use-course-progress';
import { CourseCard } from './course-card';

interface CourseGridProps {
  sites: SiteConfig[];
  isLoading?: boolean;
  courseProgress?: Map<string, CourseProgressItem>;
}

export function CourseGrid({ sites, isLoading, courseProgress }: CourseGridProps) {
  if (isLoading && sites.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8" aria-busy="true" aria-live="polite">
        Kurse werden geladen…
      </p>
    );
  }
  if (!isLoading && sites.length === 0) {
    return <p className="text-gray-500 text-center py-8">Keine Kurse verfügbar.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {sites.map((site) => (
        <CourseCard key={site.slug} site={site} progress={courseProgress?.get(site.slug)} />
      ))}
    </div>
  );
}
