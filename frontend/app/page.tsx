import StockAnalyzer from "./components/StockAnalyzer";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-blue-900">Kosh</h1>
        <p className="text-lg text-gray-600 mt-2">Autonomous Financial Intelligence</p>
      </header>

      <StockAnalyzer />

      <footer className="mt-20 text-center text-gray-400 text-sm">
        &copy; {new Date().getFullYear()} Kosh Financial Systems. production-ready-v0.1.0
      </footer>
    </main>
  );
}
