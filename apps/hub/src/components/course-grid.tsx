import type { SiteConfig } from '../config/sites';
import { CourseCard } from './course-card';

interface CourseGridProps {
  sites: SiteConfig[];
}

export function CourseGrid({ sites }: CourseGridProps) {
  if (sites.length === 0) {
    return <p className="text-gray-500 text-center py-8">Keine Kurse verfügbar.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {sites.map((site) => (
        <CourseCard key={site.slug} site={site} />
      ))}
    </div>
  );
}
