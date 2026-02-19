import { useState, useEffect } from 'react';
import { NavLink, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@lernplattform/shared';
import type { Class, User } from '@lernplattform/shared';
import { ClassList } from '../components/class-list';
import type { ClassWithCount } from '../components/class-list';
import { ClassDetail } from '../components/class-detail';
import { CreateClassForm } from '../components/create-class-form';
import { ProgressMatrix } from '../components/progress-matrix';
import { useClassProgress } from '../hooks/use-class-progress';
import { getActiveSites } from '../config/sites';

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

// ─── Matrix View ──────────────────────────────────────────────────────────────

const activeSites = getActiveSites();

function MatrixView() {
  const { pb, user } = useAuth();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);

  const { columns, rows, isLoading, error } = useClassProgress(selectedClassId, selectedCourse);

  // Load teacher's classes for the class selector
  useEffect(() => {
    let stale = false;

    async function loadClasses() {
      setClassesLoading(true);
      try {
        const result = await pb.collection('classes').getFullList<Class>({
          filter: user?.id ? `created_by = "${user.id}"` : '',
          sort: 'name',
        });
        if (!stale) setClasses(result);
      } catch {
        // Keep empty list on error
      } finally {
        if (!stale) setClassesLoading(false);
      }
    }

    loadClasses();
    return () => { stale = true; };
  }, [pb, user?.id]);

  return (
    <section aria-labelledby="matrix-heading">
      <h2 id="matrix-heading" className="text-xl font-semibold text-gray-800 mb-6">
        Fortschrittsmatrix
      </h2>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex flex-col gap-1">
          <label htmlFor="matrix-class-select" className="text-sm font-medium text-gray-700">
            Klasse
          </label>
          <select
            id="matrix-class-select"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:text-gray-400"
            value={selectedClassId ?? ''}
            onChange={(e) => setSelectedClassId(e.target.value || null)}
            disabled={classesLoading}
            aria-label="Klasse auswählen"
          >
            <option value="">— Klasse wählen —</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} ({cls.school_year})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="matrix-course-select" className="text-sm font-medium text-gray-700">
            Kurs
          </label>
          <select
            id="matrix-course-select"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={selectedCourse ?? ''}
            onChange={(e) => setSelectedCourse(e.target.value || null)}
            aria-label="Kurs auswählen"
          >
            <option value="">— Kurs wählen —</option>
            {activeSites.map((site) => (
              <option key={site.slug} value={site.slug}>
                {site.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Legende */}
      <div className="flex flex-wrap gap-4 mb-4 text-xs text-gray-600" aria-label="Farbcode-Legende">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-4 rounded bg-green-100 border border-green-200" aria-hidden="true" />
          Geschafft
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-4 rounded bg-orange-100 border border-orange-200" aria-hidden="true" />
          Versucht, nicht bestanden
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-4 rounded bg-gray-100 border border-gray-200" aria-hidden="true" />
          Nicht angefangen
        </span>
      </div>

      {/* Matrix */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <ProgressMatrix
          columns={columns}
          rows={rows}
          isLoading={isLoading}
          error={error}
        />
      </div>
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
