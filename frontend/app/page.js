// ──────────────────────────────────────────────
// Beacon — Home Page (Temporary Scaffold)
// This will be replaced with the full landing page
// including all seven product scenes.
// For now it confirms the design system is working.
// ──────────────────────────────────────────────

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">

      {/* Phase 01 Health Check */}
      <div className="glass-panel relative rounded-2xl p-8 max-w-md w-full text-center">
        <div className="glass-panel--top-highlight" />

        {/* Status dot */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping-ring absolute inline-flex h-full w-full rounded-full bg-beacon-green opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-beacon-green" />
          </span>
          <span className="text-beacon-green text-xs font-mono tracking-wider uppercase">
            Systems operational
          </span>
        </div>

        {/* Logo text */}
        <h1 className="text-2xl font-semibold text-beacon-text mb-2 tracking-tight">
          Beacon
        </h1>
        <p className="text-beacon-text-muted text-sm leading-relaxed">
          Phase 01 — Foundation &amp; Infrastructure
          <br />
          Design system active. Database connected.
        </p>

        {/* Design token swatches — visual proof the system works */}
        <div className="mt-6 grid grid-cols-5 gap-2">
          <div className="h-6 rounded bg-beacon-blue" title="beacon-blue" />
          <div className="h-6 rounded bg-beacon-green" title="beacon-green" />
          <div className="h-6 rounded bg-beacon-amber" title="beacon-amber" />
          <div className="h-6 rounded bg-beacon-red" title="beacon-red" />
          <div className="h-6 rounded bg-beacon-terminal" title="beacon-terminal" />
        </div>

        <p className="mt-3 text-2xs text-beacon-text-faint font-mono">
          blue · green · amber · red · terminal
        </p>
      </div>

    </main>
  )
}