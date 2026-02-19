function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Lernplattform</h1>
        <p className="text-gray-600 text-lg mb-8">
          Deine zentrale Plattform für IT-Berufe
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href="/ap1/"
            className="block bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-2">AP1-Trainer</h2>
            <p className="text-gray-500 text-sm">Abschlussprüfung Teil 1</p>
          </a>
          <a
            href="/pandas/"
            className="block bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Pandas</h2>
            <p className="text-gray-500 text-sm">Datenanalyse mit Python</p>
          </a>
          <a
            href="/rest/"
            className="block bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-2">REST &amp; NoSQL</h2>
            <p className="text-gray-500 text-sm">Web-APIs und Datenbanken</p>
          </a>
          <a
            href="/zuul/"
            className="block bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-2">World of Zuul</h2>
            <p className="text-gray-500 text-sm">Objektorientierte Programmierung</p>
          </a>
          <a
            href="/numpy/"
            className="block bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-2">NumPy</h2>
            <p className="text-gray-500 text-sm">Numerik mit Python</p>
          </a>
          <a
            href="/uml/"
            className="block bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-2">UML</h2>
            <p className="text-gray-500 text-sm">Softwaremodellierung</p>
          </a>
        </div>
      </div>
    </main>
  );
}

export default HomePage;
