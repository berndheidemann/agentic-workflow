import { Link } from 'react-router-dom';

function ConsentPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8 print:bg-white print:p-0">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-10 print:shadow-none print:border-0 print:rounded-none">
        <div className="print:hidden mb-6 flex gap-4">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Drucken / Als PDF speichern
          </button>
          <Link
            to="/register"
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Zurück zur Registrierung
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2 print:text-xl">
          Einwilligungserklärung zur Nutzung der Lernplattform
        </h1>
        <p className="text-sm text-gray-500 mb-6 print:text-xs">
          Für Erziehungsberechtigte minderjähriger Schülerinnen und Schüler
        </p>

        <section className="space-y-5 text-gray-700 text-sm leading-relaxed print:text-xs print:space-y-3">
          <div>
            <h2 className="text-base font-semibold text-gray-800 mb-1 print:text-sm">
              Informationen zur Datenverarbeitung
            </h2>
            <p>
              Die Schule setzt im Unterricht eine Lernplattform ein, auf der Schülerinnen und
              Schüler Übungsaufgaben zu IT-Themen bearbeiten können. Die Nutzung mit einem
              persönlichen Account ermöglicht die Speicherung des Lernfortschritts und die
              Freischaltung von Modulen durch die Lehrkraft.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-800 mb-1 print:text-sm">
              Welche Daten werden erhoben?
            </h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Benutzername</strong> — frei wählbar, kein Klarname erforderlich</li>
              <li><strong>Klassenzugehörigkeit</strong> — Zuordnung über einen Klassen-Code</li>
              <li><strong>Lernfortschritt</strong> — welche Aufgaben bearbeitet und bestanden wurden</li>
              <li><strong>PIN</strong> — 4-stellig, wird verschlüsselt gespeichert</li>
            </ul>
            <p className="mt-2">
              Es werden <strong>keine</strong> Klarnamen, E-Mail-Adressen, Telefonnummern,
              IP-Adressen oder sonstige personenbezogene Daten erhoben oder gespeichert.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-800 mb-1 print:text-sm">
              Zweck der Datenverarbeitung
            </h2>
            <p>
              Die Daten dienen ausschließlich dem Unterrichtszweck: Fortschrittsverfolgung,
              Modul-Freischaltung durch die Lehrkraft und Übersicht über den Lernstand der Klasse.
              Es findet keine Weitergabe an Dritte statt.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-800 mb-1 print:text-sm">
              Speicherdauer und Löschung
            </h2>
            <p>
              Die Daten werden für die Dauer des Schuljahres gespeichert. Am Ende des
              Schuljahres werden alle Schüler-Accounts und zugehörige Daten durch die
              Lehrkraft gelöscht. Eine vorzeitige Löschung kann jederzeit bei der Lehrkraft
              beantragt werden.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-800 mb-1 print:text-sm">
              Freiwilligkeit
            </h2>
            <p>
              Die Registrierung ist <strong>freiwillig</strong>. Alle Lerninhalte sind auch
              ohne Anmeldung vollständig nutzbar. Ohne Login werden keine Daten gespeichert.
              Die Nicht-Teilnahme hat keine Auswirkungen auf die Benotung.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-800 mb-1 print:text-sm">
              Rechte der Betroffenen
            </h2>
            <p>
              Sie haben das Recht auf Auskunft, Berichtigung und Löschung der Daten Ihres
              Kindes. Wenden Sie sich dazu an die zuständige Lehrkraft. Die Einwilligung
              kann jederzeit widerrufen werden, ohne dass dem Kind Nachteile entstehen.
            </p>
          </div>
        </section>

        <div className="mt-8 pt-6 border-t border-gray-200 print:mt-6 print:pt-4">
          <h2 className="text-base font-semibold text-gray-800 mb-4 print:text-sm">Einwilligung</h2>

          <div className="space-y-6 text-sm text-gray-700 print:text-xs print:space-y-4">
            <p>
              Ich habe die obenstehenden Informationen zur Kenntnis genommen und willige ein,
              dass mein Kind die Lernplattform mit einem persönlichen Account nutzt.
            </p>

            <div className="grid grid-cols-2 gap-8 mt-6 print:mt-4">
              <div>
                <p className="text-xs text-gray-500 mb-8 print:mb-6">Name des Kindes</p>
                <div className="border-b border-gray-300" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-8 print:mb-6">Klasse</p>
                <div className="border-b border-gray-300" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mt-6 print:mt-4">
              <div>
                <p className="text-xs text-gray-500 mb-8 print:mb-6">Ort, Datum</p>
                <div className="border-b border-gray-300" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-8 print:mb-6">
                  Unterschrift Erziehungsberechtigte/r
                </p>
                <div className="border-b border-gray-300" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default ConsentPage;
