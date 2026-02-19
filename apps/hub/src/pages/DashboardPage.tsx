import { NavLink, Routes, Route, Navigate } from 'react-router-dom';

// ─── Sub-pages (placeholder content for now) ──────────────────────────────────

function KlassenView() {
  return (
    <section aria-labelledby="klassen-heading">
      <h2 id="klassen-heading" className="text-xl font-semibold text-gray-800 mb-4">
        Klassen
      </h2>
      <p className="text-gray-500 text-sm">Klassenverwaltung folgt in REQ-021.</p>
    </section>
  );
}

function MatrixView() {
  return (
    <section aria-labelledby="matrix-heading">
      <h2 id="matrix-heading" className="text-xl font-semibold text-gray-800 mb-4">
        Fortschrittsmatrix
      </h2>
      <p className="text-gray-500 text-sm">Matrix-Ansicht folgt in REQ-023.</p>
    </section>
  );
}

function FreischaltungView() {
  return (
    <section aria-labelledby="freischaltung-heading">
      <h2 id="freischaltung-heading" className="text-xl font-semibold text-gray-800 mb-4">
        Freischaltung
      </h2>
      <p className="text-gray-500 text-sm">Modul-Freischaltung folgt in REQ-024.</p>
    </section>
  );
}

// ─── Navigation ───────────────────────────────────────────────────────────────

const navItems = [
  { to: 'klassen', label: 'Klassen' },
  { to: 'matrix', label: 'Matrix' },
  { to: 'freischaltung', label: 'Freischaltung' },
] as const;

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    isActive
      ? 'bg-blue-600 text-white'
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
  ].join(' ');

// ─── Dashboard Page ───────────────────────────────────────────────────────────

function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900">Lehrer-Dashboard</h1>
          <nav aria-label="Dashboard-Navigation" className="flex gap-2">
            {navItems.map(({ to, label }) => (
              <NavLink key={to} to={to} className={navLinkClass}>
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        <Routes>
          <Route index element={<Navigate to="klassen" replace />} />
          <Route path="klassen" element={<KlassenView />} />
          <Route path="matrix" element={<MatrixView />} />
          <Route path="freischaltung" element={<FreischaltungView />} />
        </Routes>
      </main>
    </div>
  );
}

export default DashboardPage;
