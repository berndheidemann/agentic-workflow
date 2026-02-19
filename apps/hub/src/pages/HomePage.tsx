import { Link } from 'react-router-dom';
import { useSites } from '../config/sites';
import { CourseGrid } from '../components/course-grid';
import { useCourseProgress } from '../hooks/use-course-progress';
import { useAuth } from '@lernplattform/shared';
import { ProfileSection } from '../components/profile-section';

function HomePage() {
  const { sites, isLoading } = useSites();
  const { isLoggedIn } = useAuth();
  const { progress } = useCourseProgress(isLoggedIn ? sites : []);

  // Sum completed and total exercises across all courses for the profile section
  let totalCompleted = 0;
  let totalExercises = 0;
  for (const item of progress.values()) {
    totalCompleted += item.completedExercises;
    totalExercises += item.totalExercises;
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Lernplattform</h1>
          <p className="text-gray-600 text-lg">Deine zentrale Plattform für IT-Berufe</p>
        </header>
        <ProfileSection totalCompleted={totalCompleted} totalExercises={totalExercises} />
        <CourseGrid sites={sites} isLoading={isLoading} courseProgress={progress} />
        <footer className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-400">
          <Link
            to="/datenschutz"
            className="hover:text-gray-600 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
          >
            Datenschutzerklärung
          </Link>
        </footer>
      </div>
    </main>
  );
}

export default HomePage;
