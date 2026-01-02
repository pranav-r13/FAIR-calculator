import RiskCalculator from "@/components/RiskCalculator";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500/30">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-500 opacity-60" />

      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 bg-indigo-500 rounded-sm transform rotate-45" />
            <h1 className="text-xl font-bold tracking-tight text-white">Risk Ledger</h1>
          </div>
          <div className="text-sm text-slate-400 font-mono">
            FAIR-lite Engine v1.0
          </div>
        </div>
      </header>

      <div className="container mx-auto py-8">
        <RiskCalculator />
      </div>
    </main>
  );
}
