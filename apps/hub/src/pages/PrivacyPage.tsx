import { Link } from 'react-router-dom';

function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Datenschutzerklärung</h1>

        <section className="space-y-6 text-gray-700 text-sm leading-relaxed">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">1. Verantwortlicher</h2>
            <p>
              Verantwortlich für die Datenverarbeitung auf dieser Lernplattform ist die
              zuständige Lehrkraft bzw. die Schule, die diese Plattform im Unterricht einsetzt.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">2. Welche Daten werden erhoben?</h2>
            <p>Diese Plattform erhebt nur die minimal notwendigen Daten:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Benutzername</strong> — frei wählbar, kein Klarname erforderlich</li>
              <li><strong>Klassenzugehörigkeit</strong> — Zuordnung über einen Klassen-Code</li>
              <li><strong>Lernfortschritt</strong> — welche Aufgaben bearbeitet und bestanden wurden</li>
              <li><strong>PIN</strong> — 4-stellig, wird verschlüsselt gespeichert</li>
            </ul>
            <p className="mt-2">
              Es werden <strong>keine</strong> Klarnamen, E-Mail-Adressen, Telefonnummern
              oder sonstige personenbezogene Daten erhoben.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">3. Zweck der Verarbeitung</h2>
            <p>
              Die Daten werden ausschließlich zur Bereitstellung der Lernplattform verwendet:
              Fortschrittsverfolgung, Modul-Freischaltung durch Lehrkräfte und
              Übersicht über den Lernstand der Klasse.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">4. Speicherdauer</h2>
            <p>
              Die Daten werden für die Dauer des Schuljahres gespeichert. Am Ende des
              Schuljahres können Lehrkräfte Klassen archivieren, wobei alle
              Schüler-Accounts und zugehörige Daten gelöscht werden.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">5. Nutzung ohne Anmeldung</h2>
            <p>
              Die Lerninhalte sind auch ohne Anmeldung vollständig nutzbar. Die Registrierung
              ist freiwillig und dient ausschließlich der Fortschrittsverfolgung.
              Ohne Login werden keine Daten gespeichert.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">6. Keine Tracking-Dienste</h2>
            <p>
              Diese Plattform verwendet keine externen Analyse- oder Tracking-Dienste
              (kein Google Analytics, keine Cookies von Drittanbietern). IP-Adressen
              werden nicht protokolliert.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">7. Rechte der Betroffenen</h2>
            <p>
              Schülerinnen und Schüler (bzw. deren Erziehungsberechtigte) haben das Recht
              auf Auskunft, Berichtigung und Löschung ihrer Daten. Wende dich dazu an
              deine Lehrkraft.
            </p>
          </div>
        </section>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <Link
            to="/"
            className="text-blue-600 hover:text-blue-700 text-sm underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
          >
            Zurück zur Startseite
          </Link>
        </div>
      </div>
    </main>
  );
}

export default PrivacyPage;
