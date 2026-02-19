interface ProgressBarProps {
  percentage: number;
  completedCount: number;
  totalCount: number;
  courseSlug: string;
}

export function ProgressBar({ percentage, completedCount, totalCount, courseSlug }: ProgressBarProps) {
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  const barColor = clampedPercentage >= 100 ? 'bg-green-500' : 'bg-blue-500';

  return (
    <div className="mt-3">
      <div
        role="progressbar"
        aria-valuenow={clampedPercentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Fortschritt ${courseSlug}: ${completedCount} von ${totalCount} Aufgaben (${clampedPercentage}%)`}
        className="w-full bg-gray-200 rounded-full h-2 overflow-hidden"
      >
        <div
          className={`h-2 rounded-full transition-all duration-500 ease-out ${barColor}`}
          style={{ width: `${clampedPercentage}%` }}
          aria-hidden="true"
        />
      </div>
      <p className="mt-1 text-xs text-gray-500">
        {completedCount} von {totalCount} Aufgaben
      </p>
    </div>
  );
}
