const METRICS = [
  { value: "30s",  label: "Minimum check interval"  },
  { value: "90",   label: "Days of uptime history"   },
  { value: "< 5s", label: "Median alert delivery"   },
  { value: "100%", label: "Open source, no limits"  },
]

export default function MetricsBar() {
  return (
    <div className="max-w-6xl mx-auto px-4 mb-12">
      <div
        className="grid grid-cols-2 lg:grid-cols-4 rounded-xl overflow-hidden"
        style={{ border: "1px solid rgba(255,255,255,0.08)", background: "#0D0F12" }}
      >
        {METRICS.map((m, i) => (
          <div
            key={m.label}
            className="px-6 py-5"
            style={{
              borderRight:  i < 3 ? "1px solid rgba(255,255,255,0.06)" : "none",
              borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none",
            }}
          >
            <p
              className="text-3xl font-semibold tracking-tight mb-1"
              style={{
                color:      "rgba(255,255,255,0.92)",
                fontFamily: "var(--font-jetbrains-mono, monospace)",
              }}
            >
              {m.value}
            </p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              {m.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}