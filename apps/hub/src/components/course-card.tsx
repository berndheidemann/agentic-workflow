import type { SiteConfig } from '../config/sites';
import type { CourseProgressItem } from '../hooks/use-course-progress';
import { ProgressBar } from './progress-bar';

interface CourseCardProps {
  site: SiteConfig;
  progress?: CourseProgressItem;
}

function getCourseHref(basePath: string): string {
  if (import.meta.env.DEV) {
    return `${window.location.protocol}//${window.location.hostname}:8080${basePath}`;
  }
  return basePath;
}

export function CourseCard({ site, progress }: CourseCardProps) {
  return (
    <a
      href={getCourseHref(site.basePath)}
      className="flex flex-col gap-3 bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      aria-label={`${site.name}: ${site.description}`}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6"
            aria-hidden="true"
          >
            <path d={site.icon} />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-gray-800">{site.name}</h2>
      </div>
      <p className="text-gray-500 text-sm leading-relaxed">{site.description}</p>
      {progress && progress.totalExercises > 0 && (
        <ProgressBar
          percentage={progress.percentage}
          completedCount={progress.completedExercises}
          totalCount={progress.totalExercises}
          courseSlug={site.slug}
        />
      )}
    </a>
  );
}
