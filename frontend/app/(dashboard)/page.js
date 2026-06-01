export const metadata = {
  title: "Overview",
}

export default function DashboardPage() {
  return (
    <div className="flex-1 px-8 py-8">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-beacon-text mb-1">
          Overview
        </h1>
        <p className="text-sm text-beacon-text-muted">
          Welcome to your Beacon dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Monitors"     value="--" hint="No data yet" />
        <StatCard label="Incidents"    value="--" hint="No data yet" />
        <StatCard label="Status Pages" value="--" hint="No data yet" />
        <StatCard label="Uptime"       value="--" hint="No data yet" />
      </div>

      <div
        className="rounded-xl border border-beacon-border px-6 py-12 flex flex-col items-center justify-center text-center"
        style={{ background: "var(--color-bg-elevated)" }}
      >
        <div className="h-10 w-10 rounded-xl bg-beacon-blue/10 border border-beacon-blue/20 flex items-center justify-center mb-4">
          <div className="h-2.5 w-2.5 rounded-full bg-beacon-blue" />
        </div>
        <h2 className="text-sm font-medium text-beacon-text mb-1">
          Phase 02 complete
        </h2>
        <p className="text-xs text-beacon-text-muted max-w-xs">
          Authentication, API layer, and dashboard shell are live.
          Feature pages are built in Phase 03.
        </p>
      </div>
    </div>
  )
}

function StatCard({ label, value, hint }) {
  return (
    <div
      className="rounded-xl border border-beacon-border px-4 py-4"
      style={{ background: "var(--color-bg-elevated)" }}
    >
      <p className="text-xs text-beacon-text-muted mb-2">{label}</p>
      <p className="text-2xl font-semibold text-beacon-text tracking-tight">
        {value}
      </p>
      <p className="text-xs text-beacon-text-faint mt-1">{hint}</p>
    </div>
  )
}