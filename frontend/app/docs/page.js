"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useBreakpoint } from "@/lib/useBreakpoint"

const SECTIONS = [
  {
    id:    "quickstart",
    label: "Quick Start",
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 14, height: 14 }}>
        <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm3.5 7.5l-5 3a.5.5 0 0 1-.5-.866V5.366a.5.5 0 0 1 .5-.866l5 3a.5.5 0 0 1 0 .866z"/>
      </svg>
    ),
  },
  {
    id:    "monitors",
    label: "Monitors",
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 14, height: 14 }}>
        <path d="M1 2a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6.5l2 2H11a.5.5 0 0 1 0 1H5a.5.5 0 0 1 0-1h2.5l2-2H2a1 1 0 0 1-1-1V2z"/>
      </svg>
    ),
  },
  {
    id:    "incidents",
    label: "Incidents",
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 14, height: 14 }}>
        <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
      </svg>
    ),
  },
  {
    id:    "statuspages",
    label: "Status Pages",
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 14, height: 14 }}>
        <path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm7.5-6.923c-.67.204-1.335.82-1.887 1.855A7.97 7.97 0 0 0 5.145 4H7.5V1.077zM4.09 4a9.267 9.267 0 0 1 .64-1.539 6.7 6.7 0 0 1 .597-.933A7.025 7.025 0 0 0 2.255 4H4.09zm-.582 3.5c.03-.877.138-1.718.312-2.5H1.674a6.958 6.958 0 0 0-.656 2.5h2.49zM4.847 5a12.5 12.5 0 0 0-.338 2.5H7.5V5H4.847zM8.5 5v2.5h2.99a12.495 12.495 0 0 0-.337-2.5H8.5zM4.51 8.5a12.5 12.5 0 0 0 .337 2.5H7.5V8.5H4.51zm3.99 0V11h2.653c.187-.765.306-1.608.338-2.5H8.5zM5.145 12c.138.386.295.744.468 1.068.552 1.035 1.218 1.65 1.887 1.855V12H5.145zm.182 2.472a6.696 6.696 0 0 1-.597-.933A9.268 9.268 0 0 1 4.09 12H2.255a7.024 7.024 0 0 0 3.072 2.472zM3.82 11a13.652 13.652 0 0 1-.312-2.5h-2.49c.062.89.291 1.733.656 2.5H3.82zm6.853 3.472A7.024 7.024 0 0 0 13.745 12H11.91a9.27 9.27 0 0 1-.64 1.539 6.688 6.688 0 0 1-.597.933zM8.5 12v2.923c.67-.204 1.335-.82 1.887-1.855.173-.324.33-.682.468-1.068H8.5zm3.68-1h2.146c.365-.767.594-1.61.656-2.5h-2.49a13.65 13.65 0 0 1-.312 2.5zm2.802-3.5a6.959 6.959 0 0 0-.656-2.5H12.18c.174.782.282 1.623.312 2.5h2.49zM11.27 2.461c.247.464.462.98.64 1.539h1.835a7.024 7.024 0 0 0-3.072-2.472c.218.284.418.598.597.933zM10.855 4a7.966 7.966 0 0 0-.468-1.068C9.835 1.897 9.17 1.282 8.5 1.077V4h2.355z"/>
      </svg>
    ),
  },
  {
    id:    "notifications",
    label: "Notifications",
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 14, height: 14 }}>
        <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zm.995-14.901a1 1 0 1 0-1.99 0A5.002 5.002 0 0 0 3 6c0 1.098-.5 6-2 7h14c-1.5-1-2-5.902-2-7 0-2.42-1.72-4.44-4.005-4.901z"/>
      </svg>
    ),
  },
  {
    id:    "api",
    label: "REST API",
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 14, height: 14 }}>
        <path fillRule="evenodd" d="M14 1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
        <path d="M6.854 4.646a.5.5 0 0 1 0 .708L4.207 8l2.647 2.646a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 0 1 .708 0zm2.292 0a.5.5 0 0 0 0 .708L11.793 8l-2.647 2.646a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708 0z"/>
      </svg>
    ),
  },
  {
    id:    "selfhosting",
    label: "Self-Hosting",
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 14, height: 14 }}>
        <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.858 2.929 2.929 0 0 1 0 5.858z"/>
      </svg>
    ),
  },
]

function Code({ children, lang = "" }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(children.trim())
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div style={{ position: "relative", marginBottom: 16 }}>
      <div style={{
        background:   "#060809",
        border:       "1px solid rgba(255,255,255,0.08)",
        borderRadius: 10,
        overflow:     "hidden",
      }}>
        {lang && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)" }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-jetbrains-mono,monospace)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{lang}</span>
            <button
              onClick={copy}
              style={{ fontSize: 10, color: copied ? "#22C55E" : "rgba(255,255,255,0.35)", background: "none", border: "none", cursor: "pointer", padding: "2px 6px" }}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        )}
        <pre style={{ margin: 0, padding: "14px 16px", fontSize: 12, lineHeight: 1.7, color: "rgba(255,255,255,0.75)", fontFamily: "var(--font-jetbrains-mono,monospace)", overflowX: "auto", whiteSpace: "pre" }}>
          <code>{children.trim()}</code>
        </pre>
      </div>
    </div>
  )
}

function SectionHeading({ children }) {
  return (
    <h2 style={{ fontSize: 20, fontWeight: 700, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.02em", marginBottom: 6, marginTop: 40, paddingTop: 40, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
      {children}
    </h2>
  )
}

function SubHeading({ children }) {
  return (
    <h3 style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.78)", letterSpacing: "-0.01em", marginBottom: 8, marginTop: 28 }}>
      {children}
    </h3>
  )
}

function P({ children }) {
  return (
    <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.75, marginBottom: 12 }}>
      {children}
    </p>
  )
}

function Callout({ type = "info", children }) {
  const cfg = {
    info:    { color: "#3B82F6", bg: "rgba(59,130,246,0.08)",  border: "rgba(59,130,246,0.2)"  },
    warning: { color: "#F59E0B", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.2)"  },
    success: { color: "#22C55E", bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.2)"   },
  }[type]

  return (
    <div style={{ padding: "12px 16px", borderRadius: 9, background: cfg.bg, border: `1px solid ${cfg.border}`, marginBottom: 14, borderLeft: `3px solid ${cfg.color}` }}>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, margin: 0 }}>
        {children}
      </p>
    </div>
  )
}

const SIDEBAR_WIDTH = 220
const CONTENT_MAX   = 760
const CONTENT_GUTTER_DESKTOP = 56

export default function DocsPage() {
  const router               = useRouter()
  const [active, setActive]  = useState("quickstart")
  const [drawerOpen, setDrawerOpen] = useState(false)

  const { isMobile, mounted } = useBreakpoint()
  const mobile = mounted && isMobile

  function scrollTo(id) {
    setActive(id)
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div style={{ minHeight: "100vh", background: "#080B10" }}>

      {/* Navbar */}
      <div style={{
        position:       "fixed",
        top:            0,
        left:           0,
        right:          0,
        zIndex:         50,
        height:         56,
        background:     "rgba(8,11,16,0.85)",
        backdropFilter: "blur(16px)",
        borderBottom:   "1px solid rgba(255,255,255,0.07)",
        display:        "flex",
        alignItems:     "center",
        padding:        mobile ? "0 16px" : "0 28px",
        gap:            mobile ? 10 : 20,
      }}>
        <button
          onClick={() => router.push("/")}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}
        >
          <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="7" fill="#1D4ED8"/>
            <circle cx="10" cy="18" r="2.2" fill="white"/>
            <path d="M 10 13.5 A 4.5 4.5 0 0 1 14.5 18" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.9"/>
            <path d="M 10 9.5 A 8.5 8.5 0 0 1 18.5 18" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.55"/>
            <path d="M 10 5.5 A 12.5 12.5 0 0 1 22.5 18" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.25"/>
          </svg>
          <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>Beacon</span>
        </button>
        {!mobile && (
          <>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>/</span>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>Documentation</span>
          </>
        )}
        <div style={{ flex: 1 }} />
        {!mobile && (
          <a
            href="https://github.com/whoknowsasaint/beaconapp"
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", textDecoration: "none", display: "flex", alignItems: "center", gap: 5 }}
          >
            <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 14, height: 14 }}>
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
            </svg>
            GitHub
          </a>
        )}
        <button
          onClick={() => router.push("/login")}
          style={{ height: mobile ? 30 : 30, padding: mobile ? "0 10px" : "0 14px", borderRadius: 7, background: "#2563EB", color: "white", fontSize: mobile ? 11.5 : 12, fontWeight: 500, border: "none", cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap" }}
        >
          Dashboard
        </button>
      </div>

      {/*
        Outer frame defines the SAME max-width / centering math the sidebar
        and the content both read from. This is the single source of truth —
        nothing below this guesses a number independently.
      */}
      <div style={{ position: "relative", maxWidth: 1100, margin: "0 auto", paddingTop: 56 }}>

        {/* Sidebar — position:fixed, but anchored to THIS frame via a wrapper
            that itself is position:relative + the same maxWidth/margin as content.
            No transform math, no viewport-width assumptions. */}
        {!mobile && (
          <div style={{ position: "absolute", top: 0, left: 0, width: SIDEBAR_WIDTH, height: "100%" }}>
            <div style={{
              position:    "fixed",
              top:         56,
              width:       SIDEBAR_WIDTH,
              height:      "calc(100vh - 56px)",
              overflowY:   "auto",
              padding:     "28px 20px",
              borderRight: "1px solid rgba(255,255,255,0.07)",
              background:  "#080B10",
            }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
                On this page
              </p>
              {SECTIONS.map(s => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  style={{
                    width:        "100%",
                    display:      "flex",
                    alignItems:   "center",
                    gap:          8,
                    padding:      "7px 10px",
                    borderRadius: 7,
                    background:   active === s.id ? "rgba(59,130,246,0.1)" : "transparent",
                    border:       "none",
                    color:        active === s.id ? "#3B82F6" : "rgba(255,255,255,0.45)",
                    fontSize:     13,
                    cursor:       "pointer",
                    textAlign:    "left",
                    transition:   "all 0.15s",
                    marginBottom: 2,
                  }}
                  onMouseEnter={e => { if (active !== s.id) e.currentTarget.style.color = "rgba(255,255,255,0.75)" }}
                  onMouseLeave={e => { if (active !== s.id) e.currentTarget.style.color = "rgba(255,255,255,0.45)" }}
                >
                  <span style={{ color: active === s.id ? "#3B82F6" : "rgba(255,255,255,0.3)", flexShrink: 0 }}>{s.icon}</span>
                  {s.label}
                </button>
              ))}

              <div style={{ marginTop: 24, padding: "12px", borderRadius: 8, background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}>
                <p style={{ fontSize: 11, color: "rgba(34,197,94,0.8)", fontWeight: 600, marginBottom: 4 }}>Open Source</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>MIT licensed. Free to self-host forever.</p>
              </div>
            </div>
          </div>
        )}

        {/* Content — pushed right by the sidebar's track width via marginLeft.
            The sidebar's fixed element is positioned by a wrapper that lives at
            the exact same x-coordinate as this content's left edge, because
            both are children of the SAME centered, max-width frame above. */}
        <div style={{
          marginLeft: mobile ? 0 : SIDEBAR_WIDTH,
          padding:    mobile ? "24px 20px 80px" : `40px ${CONTENT_GUTTER_DESKTOP}px 120px`,
          minWidth:   0,
          maxWidth:   mobile ? "100%" : CONTENT_MAX,
        }}>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

            <div style={{ marginBottom: 40 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#3B82F6", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Documentation
              </span>
              <h1 style={{ fontSize: 32, fontWeight: 700, color: "rgba(255,255,255,0.95)", letterSpacing: "-0.03em", marginTop: 6, marginBottom: 10 }}>
                Beacon Documentation
              </h1>
              <P>
                Beacon is a free, open-source uptime monitoring and status page platform. Monitor your services, manage incidents, and publish branded status pages — all self-hosted.
              </P>
            </div>

            {/* Quick Start */}
            <div id="quickstart">
              <SectionHeading>Quick Start</SectionHeading>
              <P>Get Beacon running locally in under 5 minutes.</P>

              <SubHeading>Prerequisites</SubHeading>
              <P>Python 3.11+, Node.js 18+, PostgreSQL 14+.</P>

              <SubHeading>1. Clone and install</SubHeading>
              <Code lang="bash">{`
git clone https://github.com/whoknowsasaint/beaconapp
cd beacon

# Backend
cd backend
python -m venv .venv
.venv\\Scripts\\Activate.ps1   # Windows
# source .venv/bin/activate   # macOS/Linux
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install
              `}</Code>

              <SubHeading>2. Configure environment</SubHeading>
              <P>Copy the example env file and set your database credentials.</P>
              <Code lang="bash">{`
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL, SECRET_KEY, ALLOWED_HOSTS
              `}</Code>
              <Code lang="env">{`
DATABASE_URL=postgres://user:password@localhost:5432/beacon
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
              `}</Code>

              <SubHeading>3. Run migrations and create admin</SubHeading>
              <Code lang="bash">{`
python manage.py migrate --settings=core.settings.development
python manage.py createsuperuser --settings=core.settings.development
              `}</Code>

              <SubHeading>4. Start all three processes</SubHeading>
              <Code lang="bash">{`
# Terminal 1 — Django API
python manage.py runserver --settings=core.settings.development

# Terminal 2 — Checker worker
python manage.py runchecker --settings=core.settings.development

# Terminal 3 — Next.js frontend
cd ../frontend && npm run dev
              `}</Code>

              <Callout type="success">
                Open <strong>http://localhost:3000</strong> and sign in with your superuser credentials.
              </Callout>
            </div>

            {/* Monitors */}
            <div id="monitors">
              <SectionHeading>Monitors</SectionHeading>
              <P>Monitors check your services at regular intervals and record the result. Beacon supports three monitor types.</P>

              <SubHeading>Monitor types</SubHeading>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {[
                  { type: "HTTP / HTTPS", desc: "Makes an HTTP GET request and checks the response status code against your expected codes. Measures response time." },
                  { type: "TCP Port",     desc: "Attempts a TCP connection to a host and port. Useful for databases, SMTP, or any non-HTTP service." },
                  { type: "ICMP Ping",    desc: "Sends a ping to a host and checks for a response. Lowest-level connectivity test." },
                ].map(r => (
                  <div key={r.type} style={{ padding: "12px 16px", borderRadius: 9, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.8)", marginBottom: 4 }}>{r.type}</p>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.42)", lineHeight: 1.5, margin: 0 }}>{r.desc}</p>
                  </div>
                ))}
              </div>

              <SubHeading>Check intervals</SubHeading>
              <P>Minimum interval is 30 seconds. Available options: 30s, 60s, 5 min, 10 min, 30 min, 60 min. The checker worker ticks every 10 seconds and runs all monitors that are due.</P>

              <SubHeading>Status lifecycle</SubHeading>
              <Code lang="text">{`
pending      → Monitor created, no checks run yet
operational  → Last check returned expected status code
degraded     → Check returned an unexpected status code
outage       → Check failed entirely (connection error, timeout, DNS failure)
paused       → Monitor is disabled, no checks running
              `}</Code>
            </div>

            {/* Incidents */}
            <div id="incidents">
              <SectionHeading>Incidents</SectionHeading>
              <P>Incidents represent a service disruption. They can be created automatically by the checker worker or manually by you.</P>

              <SubHeading>Auto-detection</SubHeading>
              <P>When a monitor&apos;s status changes to <code style={{ fontFamily: "var(--font-jetbrains-mono,monospace)", fontSize: 12, color: "#F59E0B", background: "rgba(245,158,11,0.1)", padding: "1px 5px", borderRadius: 4 }}>outage</code>, the checker worker automatically creates a Critical incident linked to that monitor. When the monitor recovers, the incident is automatically resolved.</P>

              <SubHeading>Incident workflow</SubHeading>
              <Code lang="text">{`
Investigating → Identified → Monitoring → Resolved
              `}</Code>
              <P>Each step is clickable in the dashboard. You can only advance to the next step — skipping is not allowed. Each step change is recorded in the update feed.</P>

              <SubHeading>Updates</SubHeading>
              <P>Post status updates from the incident detail page. Updates marked &quot;Visible on status page&quot; appear on your public status page for subscribers to see.</P>
            </div>

            {/* Status Pages */}
            <div id="statuspages">
              <SectionHeading>Status Pages</SectionHeading>
              <P>Status pages are public pages showing the health of your services. Each status page has a unique slug that determines its URL.</P>

              <SubHeading>Creating a status page</SubHeading>
              <P>Go to Dashboard → Status Pages → Create status page. Set a name and a slug. The slug becomes the public URL: <code style={{ fontFamily: "var(--font-jetbrains-mono,monospace)", fontSize: 12, color: "#3B82F6" }}>yoursite.com/status/your-slug</code>.</P>

              <SubHeading>Adding monitors</SubHeading>
              <P>Open the status page builder and add monitors. Each monitor appears as a service row on the public page. Toggle &quot;Show uptime history&quot; to display 60-day uptime bars per monitor.</P>

              <SubHeading>Overall status logic</SubHeading>
              <Code lang="text">{`
All Operational  → all monitors are operational, no active incidents
Partial Outage   → some monitors degraded OR active incidents exist
Major Outage     → one or more monitors in outage state
              `}</Code>
            </div>

            {/* Notifications */}
            <div id="notifications">
              <SectionHeading>Notifications</SectionHeading>

              <SubHeading>Telegram</SubHeading>
              <P>Create a Telegram bot via @BotFather. Add the bot token to your .env file. Register your webhook endpoint with Telegram.</P>
              <Code lang="env">{`
TELEGRAM_BOT_TOKEN=your_bot_token_here
              `}</Code>
              <Code lang="bash">{`
# Register webhook (replace with your public URL)
curl "https://api.telegram.org/bot{TOKEN}/setWebhook?url=https://yourdomain.com/api/v1/telegram/webhook/"

# For local dev — use ngrok
ngrok http 8000
              `}</Code>
              <P>Users subscribe by sending <code style={{ fontFamily: "var(--font-jetbrains-mono,monospace)", fontSize: 12, color: "#22C55E", background: "rgba(34,197,94,0.08)", padding: "1px 5px", borderRadius: 4 }}>/start your-slug</code> to the bot.</P>

              <SubHeading>Slack</SubHeading>
              <P>Create a Slack app with Incoming Webhooks enabled. Paste the webhook URL into the status page builder. Notifications fire automatically on incident creation and resolution.</P>

              <SubHeading>Email</SubHeading>
              <P>Configure an SMTP backend in your .env. For development, the console backend prints emails to your terminal.</P>
              <Code lang="env">{`
# Development (prints to terminal)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend

# Production (Gmail example)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=you@gmail.com
EMAIL_HOST_PASSWORD=your_app_password
              `}</Code>
            </div>

            {/* API */}
            <div id="api">
              <SectionHeading>REST API</SectionHeading>
              <P>Beacon exposes a full REST API. All endpoints require authentication via API key or session cookie.</P>

              <SubHeading>Authentication</SubHeading>
              <Code lang="bash">{`
# API key (recommended for scripts)
curl -H "Authorization: Bearer bk_live_your_key" https://yoursite.com/api/v1/monitors/

# Session cookie (browser / dashboard)
# Cookie is set automatically after login
              `}</Code>

              <SubHeading>Key endpoints</SubHeading>
              <Code lang="text">{`
GET    /api/v1/monitors/                  List monitors
POST   /api/v1/monitors/                  Create monitor
GET    /api/v1/monitors/{id}/             Get monitor
PATCH  /api/v1/monitors/{id}/             Update monitor
DELETE /api/v1/monitors/{id}/             Delete monitor
GET    /api/v1/monitors/{id}/uptime/      90-day uptime buckets
GET    /api/v1/monitors/{id}/checks/      Check history

GET    /api/v1/incidents/                 List incidents
POST   /api/v1/incidents/                 Create incident
GET    /api/v1/incidents/{id}/            Get incident
PATCH  /api/v1/incidents/{id}/            Update incident status
POST   /api/v1/incidents/{id}/updates/    Post incident update

GET    /api/v1/status-pages/              List status pages
POST   /api/v1/status-pages/             Create status page
GET    /api/v1/status-pages/{slug}/public/ Public status data (no auth)
              `}</Code>

              <SubHeading>Create an incident via API</SubHeading>
              <Code lang="bash">{`
curl -X POST https://yoursite.com/api/v1/incidents/ \\
  -H "Authorization: Bearer bk_live_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "API degraded",
    "severity": "critical",
    "status": "investigating"
  }'
              `}</Code>
            </div>

            {/* Self-Hosting */}
            <div id="selfhosting">
              <SectionHeading>Self-Hosting</SectionHeading>

              <SubHeading>Docker Compose (recommended)</SubHeading>
              <Code lang="yaml">{`
version: "3.9"
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: beacon
      POSTGRES_USER: beacon
      POSTGRES_PASSWORD: secret
    volumes:
      - pgdata:/var/lib/postgresql/data

  backend:
    build: ./backend
    env_file: ./backend/.env.production
    depends_on: [db]
    ports: ["8000:8000"]

  checker:
    build: ./backend
    command: python manage.py runchecker --settings=core.settings.production
    env_file: ./backend/.env.production
    depends_on: [db]

  frontend:
    build: ./frontend
    environment:
      NEXT_PUBLIC_API_URL: https://yoursite.com
    ports: ["3000:3000"]

volumes:
  pgdata:
              `}</Code>

              <Callout type="warning">
                Always set <strong>DEBUG=False</strong> and a strong <strong>SECRET_KEY</strong> in production. Use HTTPS. Set <strong>SESSION_COOKIE_SECURE=True</strong> and <strong>CSRF_COOKIE_SECURE=True</strong>.
              </Callout>

              <SubHeading>Production environment variables</SubHeading>
              <Code lang="env">{`
DATABASE_URL=postgres://user:password@db:5432/beacon
SECRET_KEY=long-random-string-here
DEBUG=False
ALLOWED_HOSTS=yoursite.com,www.yoursite.com
CORS_ALLOWED_ORIGINS=https://yoursite.com
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
SECURE_SSL_REDIRECT=True
TELEGRAM_BOT_TOKEN=optional
              `}</Code>

              <SubHeading>Nginx reverse proxy</SubHeading>
              <Code lang="nginx">{`
server {
    listen 443 ssl;
    server_name yoursite.com;

    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
    }
}
              `}</Code>
            </div>

          </motion.div>

          {/* Footer */}
          <div style={{
            marginTop:     64,
            paddingTop:    32,
            borderTop:     "1px solid rgba(255,255,255,0.07)",
            display:       "flex",
            alignItems:    "center",
            justifyContent:"space-between",
            flexWrap:      "wrap",
            gap:           16,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="7" fill="#1D4ED8"/>
                <circle cx="10" cy="18" r="2.2" fill="white"/>
                <path d="M 10 13.5 A 4.5 4.5 0 0 1 14.5 18" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.9"/>
                <path d="M 10 9.5 A 8.5 8.5 0 0 1 18.5 18" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.55"/>
                <path d="M 10 5.5 A 12.5 12.5 0 0 1 22.5 18" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.25"/>
              </svg>
              <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
                Powered by Beacon
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
                MIT License · Free to self-host forever
              </span>
              <a
                href="https://github.com/whoknowsasaint/beaconapp"
                target="_blank"
                rel="noreferrer"
                style={{
                  display:    "flex",
                  alignItems: "center",
                  gap:        6,
                  fontSize:   12,
                  color:      "rgba(255,255,255,0.4)",
                  textDecoration: "none",
                  transition: "color 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.8)"}
                onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
              >
                <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 14, height: 14 }}>
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
                </svg>
                whoknowsasaint/beaconapp
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile: floating "On this page" button */}
      {mobile && (
        <>
          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onClick={() => setDrawerOpen(true)}
            style={{
              position:       "fixed",
              bottom:         24,
              right:          20,
              zIndex:         40,
              height:         40,
              padding:        "0 16px",
              borderRadius:   "9999px",
              background:     "rgba(8,11,16,0.9)",
              border:         "1px solid rgba(255,255,255,0.15)",
              color:          "rgba(255,255,255,0.75)",
              fontSize:       13,
              fontWeight:     500,
              cursor:         "pointer",
              display:        "flex",
              alignItems:     "center",
              gap:            6,
              backdropFilter: "blur(12px)",
              boxShadow:      "0 4px 20px rgba(0,0,0,0.5)",
            }}
          >
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 12, height: 12 }}>
              <path d="M2 4h10M2 7h7M2 10h5" strokeLinecap="round"/>
            </svg>
            On this page
          </motion.button>

          <AnimatePresence>
            {drawerOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setDrawerOpen(false)}
                  style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
                />
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", stiffness: 280, damping: 28 }}
                  style={{
                    position:    "fixed",
                    bottom:      0,
                    left:        0,
                    right:       0,
                    zIndex:      51,
                    background:  "#0D1117",
                    borderRadius:"20px 20px 0 0",
                    border:      "1px solid rgba(255,255,255,0.1)",
                    padding:     "20px 20px calc(24px + env(safe-area-inset-bottom))",
                    maxHeight:   "70vh",
                    overflowY:   "auto",
                  }}
                >
                  <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)", margin: "0 auto 20px" }} />
                  <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
                    On this page
                  </p>
                  {SECTIONS.map(s => (
                    <button
                      key={s.id}
                      onClick={() => { scrollTo(s.id); setDrawerOpen(false) }}
                      style={{
                        width:        "100%",
                        display:      "flex",
                        alignItems:   "center",
                        gap:          10,
                        padding:      "12px 14px",
                        borderRadius: 9,
                        background:   active === s.id ? "rgba(59,130,246,0.1)" : "transparent",
                        border:       "none",
                        color:        active === s.id ? "#3B82F6" : "rgba(255,255,255,0.55)",
                        fontSize:     15,
                        cursor:       "pointer",
                        textAlign:    "left",
                        marginBottom: 2,
                      }}
                    >
                      <span style={{ color: active === s.id ? "#3B82F6" : "rgba(255,255,255,0.3)" }}>{s.icon}</span>
                      {s.label}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  )
}
