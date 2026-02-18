import { useEffect, useState } from 'react';
import PocketBase from 'pocketbase';
import { getGreeting } from '@lernplattform/shared';

type HealthStatus = 'loading' | 'connected' | 'error';

const pb = new PocketBase('');

function App() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus>('loading');
  const greeting = getGreeting();

  useEffect(() => {
    pb.health
      .check()
      .then(() => setHealthStatus('connected'))
      .catch(() => setHealthStatus('error'));
  }, []);

  const statusConfig = {
    loading: { text: 'Verbindung wird geprüft…', color: 'text-yellow-600', bg: 'bg-yellow-50' },
    connected: { text: 'PocketBase verbunden', color: 'text-green-600', bg: 'bg-green-50' },
    error: { text: 'PocketBase nicht erreichbar', color: 'text-red-600', bg: 'bg-red-50' },
  };

  const status = statusConfig[healthStatus];

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Hello Lernplattform</h1>
        <p className="text-gray-500 text-sm mb-6">Tech-Stack Spike — Vertikaler Durchstich</p>

        <div className="space-y-4">
          <section aria-label="Shared Package Test">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Shared Package
            </h2>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-blue-700 text-sm font-medium">{greeting}</p>
            </div>
          </section>

          <section aria-label="PocketBase Verbindung">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Backend-Status
            </h2>
            <div
              className={`${status.bg} rounded-lg p-3`}
              role="status"
              aria-live="polite"
              aria-busy={healthStatus === 'loading'}
            >
              <p className={`${status.color} text-sm font-medium`}>{status.text}</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default App;
