import { useState, useEffect } from 'react';
import { NavLink, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@lernplattform/shared';
import type { Class, User } from '@lernplattform/shared';
import { ClassList } from '../components/class-list';
import type { ClassWithCount } from '../components/class-list';
import { ClassDetail } from '../components/class-detail';
import { CreateClassForm } from '../components/create-class-form';

// ─── Klassen View ─────────────────────────────────────────────────────────────

function KlassenView() {
  const { pb, user } = useAuth();
  const navigate = useNavigate();

  const [classes, setClasses] = useState<ClassWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    let stale = false;

    async function loadClasses() {
      setIsLoading(true);
      try {
        // Load all classes created by this teacher
        const [allClasses, allStudents] = await Promise.all([
          pb.collection('classes').getFullList<Class>({
            filter: user?.id ? `created_by = "${user.id}"` : '',
            sort: 'name',
          }),
          // Fetch all students to count per class (single API call, client-side grouping)
          pb.collection('users').getFullList<User>({
            filter: 'class_id != ""',
            fields: 'id,class_id',
          }),
        ]);

        if (stale) return;

        // Group students by class_id
        const countByClass = new Map<string, number>();
        for (const student of allStudents) {
          if (student.class_id) {
            countByClass.set(student.class_id, (countByClass.get(student.class_id) ?? 0) + 1);
          }
        }

        const withCounts: ClassWithCount[] = allClasses.map((classData) => ({
          classData,
          studentCount: countByClass.get(classData.id) ?? 0,
        }));

        setClasses(withCounts);
      } catch {
        // Keep empty list on error — ClassList handles empty state
      } finally {
        if (!stale) setIsLoading(false);
      }
    }

    loadClasses();
    return () => {
      stale = true;
    };
  }, [pb, user?.id]);

  function handleCreated(newClass: Class) {
    setClasses((prev) => [
      ...prev,
      { classData: newClass, studentCount: 0 },
    ]);
    setShowCreateForm(false);
  }

  if (showCreateForm) {
    return (
      <section aria-labelledby="klassen-heading">
        <h2 id="klassen-heading" className="sr-only">
          Klassen
        </h2>
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <CreateClassForm onCreated={handleCreated} onCancel={() => setShowCreateForm(false)} />
        </div>
      </section>
    );
  }

  return (
    <ClassList
      classes={classes}
      isLoading={isLoading}
      onSelectClass={(classId) => navigate(`/dashboard/klassen/${classId}`)}
      onCreateNew={() => setShowCreateForm(true)}
    />
  );
}

// ─── Klassen Detail View ──────────────────────────────────────────────────────

function KlassenDetailView() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();

  if (!classId) {
    return <Navigate to="/dashboard/klassen" replace />;
  }

  return (
    <ClassDetail
      classId={classId}
      onBack={() => navigate('/dashboard/klassen')}
    />
  );
}

// ─── Sub-pages (placeholder) ──────────────────────────────────────────────────

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
          <Route path="klassen/:classId" element={<KlassenDetailView />} />
          <Route path="matrix" element={<MatrixView />} />
          <Route path="freischaltung" element={<FreischaltungView />} />
        </Routes>
      </main>
    </div>
  );
}

export default DashboardPage;
