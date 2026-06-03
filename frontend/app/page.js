import Navbar          from "@/components/landing/Navbar"
import Hero            from "@/components/landing/Hero"
import Footer          from "@/components/landing/Footer"
import UptimeScene     from "@/components/scenes/UptimeScene"
import IncidentScene   from "@/components/scenes/IncidentScene"
import TelegramScene   from "@/components/scenes/TelegramScene"
import SlackScene      from "@/components/scenes/SlackScene"
import StatusPageScene from "@/components/scenes/StatusPageScene"
import ReportingScene  from "@/components/scenes/ReportingScene"
import APIScene        from "@/components/scenes/APIScene"

const SCENE_SECTIONS = [
  {
    id:          "scene-uptime",
    label:       "Uptime Monitoring",
    description: "Watch every service 24/7. See exactly what is up, what is down, and for how long.",
    tag:         "Always watching",
    Scene:       UptimeScene,
  },
  {
    id:          "scene-incident",
    label:       "Incident Management",
    description: "Structured workflow from detection to resolution. Keep your team and users informed at every step.",
    tag:         "Structured response",
    Scene:       IncidentScene,
  },
  {
    id:          "scene-telegram",
    label:       "Telegram Notifications",
    description: "Subscribers get instant, beautiful Telegram messages the moment an incident starts or resolves.",
    tag:         "Instant alerts",
    Scene:       TelegramScene,
  },
  {
    id:          "scene-slack",
    label:       "Slack Notifications",
    description: "Your ops team gets structured Slack alerts in the right channel with full context -- no noise, just signal.",
    tag:         "Team awareness",
    Scene:       SlackScene,
  },
  {
    id:          "scene-status-page",
    label:       "Public Status Pages",
    description: "Give your customers a branded, live status page that builds trust before they ever email you.",
    tag:         "Customer trust",
    Scene:       StatusPageScene,
  },
  {
    id:          "scene-reporting",
    label:       "Historical Reporting",
    description: "A complete picture of your reliability over time. Exportable, honest, and clear.",
    tag:         "Full history",
    Scene:       ReportingScene,
  },
  {
    id:          "scene-api",
    label:       "API & Integrations",
    description: "Beacon has an API. Automate everything. It is built for developers.",
    tag:         "Developer owned",
    Scene:       APIScene,
  },
]

function SectionLabel({ tag, label, description, flip = false }) {
  return (
    <div className={`flex flex-col gap-3 ${flip ? "lg:text-right" : ""}`}>
      <div
        className={`inline-flex items-center gap-1.5 ${flip ? "lg:self-end" : "self-start"}`}
      >
        <span className="text-2xs font-mono text-beacon-blue uppercase tracking-widest">
          {tag}
        </span>
      </div>
      <h2 className="text-2xl sm:text-3xl font-semibold text-beacon-text tracking-tight leading-tight">
        {label}
      </h2>
      <p className="text-base text-beacon-text-muted leading-relaxed max-w-sm">
        {description}
      </p>
    </div>
  )
}

function FeatureSection({ id, label, description, tag, Scene, index }) {
  const flip = index % 2 !== 0

  return (
    <section
      id={id}
      className="max-w-5xl mx-auto px-6 py-20"
    >
      <div
        className={[
          "grid grid-cols-1 gap-12 items-center",
          flip
            ? "lg:grid-cols-2 lg:[&>*:first-child]:order-2 lg:[&>*:last-child]:order-1"
            : "lg:grid-cols-2",
        ].join(" ")}
      >
        <SectionLabel
          tag={tag}
          label={label}
          description={description}
          flip={flip}
        />
        <Scene />
      </div>
    </section>
  )
}

export default function LandingPage() {
  return (
    <>
      <Navbar />

      <main>
        <Hero />

        <div
          id="features"
          className="w-full max-w-5xl mx-auto px-6 h-px my-4"
          style={{ background: "var(--color-border)" }}
          aria-hidden="true"
        />

        {SCENE_SECTIONS.map((section, i) => (
          <FeatureSection
            key={section.id}
            index={i}
            {...section}
          />
        ))}

        <section className="max-w-5xl mx-auto px-6 py-24 text-center">
          <div
            className="rounded-2xl border border-beacon-border px-8 py-16"
            style={{ background: "var(--color-bg-elevated)" }}
          >
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping-ring absolute inline-flex h-full w-full rounded-full bg-beacon-green opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-beacon-green" />
              </span>
              <span className="text-xs font-mono text-beacon-green uppercase tracking-wider">
                Open source
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-semibold text-beacon-text tracking-tight mb-4">
              Own your infrastructure.
              <br />
              <span
                className="text-transparent bg-clip-text"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #3B82F6 0%, #60A5FA 50%, #93C5FD 100%)",
                }}
              >
                Own your status pages.
              </span>
            </h2>

            <p className="text-base text-beacon-text-muted max-w-lg mx-auto mb-8 leading-relaxed">
              Beacon is free, open source, and runs on your own servers.
              No vendor lock-in. No pricing tiers. No limits.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="/login"
                className={[
                  "h-11 px-8 text-sm font-medium rounded-xl inline-flex items-center",
                  "bg-beacon-blue text-white",
                  "hover:bg-blue-500 transition-colors duration-150",
                ].join(" ")}
              >
                Get started free
              </a>
              <a
                href="https://github.com/beacon"
                target="_blank"
                rel="noopener noreferrer"
                className={[
                  "h-11 px-8 text-sm font-medium rounded-xl inline-flex items-center gap-2",
                  "border border-beacon-border text-beacon-text-muted",
                  "hover:bg-white/[0.06] hover:text-beacon-text transition-colors",
                ].join(" ")}
              >
                View on GitHub
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}