"use client"

import Navbar           from "@/components/landing/Navbar"
import Hero             from "@/components/landing/Hero"
import StickySection    from "@/components/landing/StickySection"
import IncidentStage    from "@/components/landing/IncidentStage"
import StatusPageStage  from "@/components/landing/StatusPageStage"
import TrustSection     from "@/components/landing/TrustSection"
import Footer           from "@/components/landing/Footer"

export default function LandingPage() {
  return (
    <>
      <Navbar />

      <main>
        <Hero />

        <section
          style={{
            padding:    "0 0 80px",
            background: "#080B10",
          }}
        >
          <div style={{ textAlign: "center", padding: "0 24px 32px" }}>
            <p style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "rgba(59,130,246,0.75)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
              The product
            </p>
            <h2 style={{ fontSize: 30, fontWeight: 600, color: "rgba(255,255,255,0.9)", letterSpacing: "-0.015em", marginBottom: 8 }}>
              Your reliability dashboard.
            </h2>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", maxWidth: 420, margin: "0 auto" }}>
              Scroll to explore every feature. The product is always visible.
            </p>
          </div>

          <StickySection />
        </section>

        <IncidentStage />

        <StatusPageStage />

        <TrustSection />

        <section style={{ padding: "64px 24px 80px", textAlign: "center", background: "#060809" }}>
          <div style={{ maxWidth: 560, margin: "0 auto" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E", display: "inline-block", animation: "pulse-soft 2s ease-in-out infinite" }} aria-hidden="true" />
              <span style={{ fontSize: 11, color: "rgba(34,197,94,0.75)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Ready to deploy
              </span>
            </div>

            <h2 style={{ fontSize: 36, fontWeight: 700, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.02em", lineHeight: 1.12, marginBottom: 14 }}>
              Own your monitoring.
              <br />
              <span style={{ color: "rgba(255,255,255,0.35)" }}>
                Own your uptime.
              </span>
            </h2>

            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.42)", lineHeight: 1.65, marginBottom: 28 }}>
              No monthly fees. No data sent to third parties. Deploy Beacon on your own infrastructure in under five minutes.
            </p>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <a
                href="/login"
                style={{ height: 42, padding: "0 24px", fontSize: 13, fontWeight: 600, background: "#3B82F6", color: "white", borderRadius: 10, display: "inline-flex", alignItems: "center", textDecoration: "none", letterSpacing: "-0.01em" }}
                onMouseEnter={e => e.currentTarget.style.background = "#2563EB"}
                onMouseLeave={e => e.currentTarget.style.background = "#3B82F6"}
              >
                Start monitoring free
              </a>
              <a
                href="https://github.com/beacon"
                target="_blank"
                rel="noopener noreferrer"
                style={{ height: 42, padding: "0 24px", fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, display: "inline-flex", alignItems: "center", textDecoration: "none" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "rgba(255,255,255,0.8)" }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.55)" }}
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