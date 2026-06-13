"use client";
import Navbar      from "@/components/landing/Navbar"
import Hero        from "@/components/landing/Hero"
import MetricsBar  from "@/components/landing/MetricsBar"
import BentoGrid   from "@/components/landing/BentoGrid"
import ProductDemo from "@/components/landing/ProductDemo"
import Footer      from "@/components/landing/Footer"

export default function LandingPage() {
  return (
    <>
      <Navbar />

      <main>
        <Hero />

        <div id="features" />

        <MetricsBar />

        <BentoGrid />

        <ProductDemo />

        <section className="max-w-6xl mx-auto px-4 pb-24 pt-4">
          <div
            className="rounded-2xl px-8 py-16 text-center"
            style={{ background: "#0D0F12", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
                <span
                  className="absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ background: "#22C55E", animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite" }}
                />
                <span
                  className="relative inline-flex rounded-full h-2.5 w-2.5"
                  style={{ background: "#22C55E" }}
                />
              </span>
              <span
                className="text-xs font-mono uppercase tracking-widest"
                style={{ color: "rgba(34,197,94,0.8)" }}
              >
                Open source · MIT License
              </span>
            </div>

            <h2
              className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4"
              style={{ color: "rgba(255,255,255,0.92)", lineHeight: 1.15 }}
            >
              Own your infrastructure.
              <br />
              <span
                className="text-transparent bg-clip-text"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #3B82F6 0%, #60A5FA 60%, #93C5FD 100%)",
                }}
              >
                Own your status pages.
              </span>
            </h2>

            <p
              className="text-base max-w-md mx-auto mb-8 leading-relaxed"
              style={{ color: "rgba(255,255,255,0.42)" }}
            >
              No vendor lock-in. No pricing tiers. No limits. Deploy Beacon on your own
              infrastructure in under five minutes.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="/login"
                className="h-10 px-6 text-sm font-medium rounded-lg inline-flex items-center transition-colors duration-150"
                style={{ background: "#3B82F6", color: "white" }}
              >
                Start monitoring free
              </a>
              <a
                href="https://github.com/whoknowsasaint/beaconapp"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 px-6 text-sm font-medium rounded-lg inline-flex items-center gap-2 transition-colors duration-150"
                style={{
                  border:     "1px solid rgba(255,255,255,0.1)",
                  color:      "rgba(255,255,255,0.55)",
                  background: "transparent",
                }}
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