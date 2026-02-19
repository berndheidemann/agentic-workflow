import { getActiveSites } from '../config/sites';
import { CourseGrid } from '../components/course-grid';

function HomePage() {
  const sites = getActiveSites();

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Lernplattform</h1>
          <p className="text-gray-600 text-lg">Deine zentrale Plattform für IT-Berufe</p>
        </header>
        <CourseGrid sites={sites} />
      </div>
    </main>
  );
}

export default HomePage;
