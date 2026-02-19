import { Link } from 'react-router-dom';

function LoginPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Anmelden</h1>
        <p className="text-gray-500 text-sm mb-6">
          Melde dich mit deinem Klassen-Code an.
        </p>
        <p className="text-gray-400 text-sm italic">
          Login-Formular folgt in REQ-012.
        </p>
        <div className="mt-6 text-center">
          <Link
            to="/register"
            className="text-blue-600 hover:text-blue-700 text-sm underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
          >
            Noch kein Konto? Jetzt registrieren
          </Link>
        </div>
      </div>
    </main>
  );
}

export default LoginPage;
