import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Seite nicht gefunden</h2>
        <p className="text-gray-500 mb-6">
          Diese Seite existiert nicht.
        </p>
        <Link
          to="/"
          className="inline-block bg-blue-600 text-white rounded-lg px-6 py-3 font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Zur Startseite
        </Link>
      </div>
    </main>
  );
}

export default NotFoundPage;
