import { Link } from 'react-router-dom';
import { useSites } from '../config/sites';
import { CourseGrid } from '../components/course-grid';

function HomePage() {
  const { sites, isLoading } = useSites();

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Lernplattform</h1>
          <p className="text-gray-600 text-lg">Deine zentrale Plattform für IT-Berufe</p>
        </header>
        <CourseGrid sites={sites} isLoading={isLoading} />
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
