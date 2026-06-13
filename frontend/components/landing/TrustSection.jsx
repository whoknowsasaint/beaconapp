"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

export default function Hero() {
  const router = useRouter()

  return (
    <section
      style={{
        position:  "relative",
        paddingTop: 120,
        paddingBottom: 48,
        overflow:  "hidden",
        display:   "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <motion.div
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 65% 45% at 50% -8%, rgba(59,130,246,0.15), transparent)", pointerEvents: "none" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: "relative", zIndex: 1, maxWidth: 680, padding: "0 24px" }}
      >
        <div
          style={{
            display:      "inline-flex",
            alignItems:   "center",
            gap:          7,
            padding:      "4px 12px 4px 8px",
            borderRadius: 9999,
            background:   "rgba(255,255,255,0.04)",
            border:       "1px solid rgba(255,255,255,0.09)",
            fontSize:     11,
            color:        "rgba(255,255,255,0.5)",
            marginBottom: 22,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 9999, padding: "1px 7px", fontSize: 10, color: "#22C55E", fontWeight: 500 }}>
            <motion.span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22C55E", display: "inline-block" }} animate={{ opacity: [1,0.4,1] }} transition={{ duration: 2, repeat: Infinity }} />
            Open source
          </span>
          MIT License · Self-hostable · Free forever
        </div>

        <h1
          style={{
            fontSize:      "clamp(36px, 5vw, 58px)",
            fontWeight:    700,
            color:         "rgba(255,255,255,0.95)",
            letterSpacing: "-0.025em",
            lineHeight:    1.1,
            marginBottom:  18,
          }}
        >
          Know when something
          <br />
          <span
            style={{
              WebkitBackgroundClip: "text",
              WebkitTextFillColor:  "transparent",
              backgroundImage:      "linear-gradient(135deg, #60A5FA 0%, #3B82F6 50%, #818CF8 100%)",
              backgroundClip:       "text",
            }}
          >
            breaks first.
          </span>
        </h1>

        <p style={{ fontSize: 17, color: "rgba(255,255,255,0.45)", lineHeight: 1.65, marginBottom: 28, maxWidth: 520, margin: "0 auto 28px" }}>
          Open source uptime monitoring, incident management, and public status pages. The complete reliability stack, self-hosted.
        </p>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 16 }}>
          <button
            onClick={() => router.push("/login")}
            style={{ height: 40, padding: "0 20px", fontSize: 13, fontWeight: 500, background: "#3B82F6", color: "white", borderRadius: 9, border: "none", cursor: "pointer", letterSpacing: "-0.01em" }}
            onMouseEnter={e => e.currentTarget.style.background = "#2563EB"}
            onMouseLeave={e => e.currentTarget.style.background = "#3B82F6"}
          >
            Start monitoring free
          </button>
          <a
            href="https://github.com/whoknowsasaint/beaconapp"
            target="_blank"
            rel="noopener noreferrer"
            style={{ height: 40, padding: "0 20px", fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, display: "inline-flex", alignItems: "center", gap: 7, textDecoration: "none" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "rgba(255,255,255,0.85)" }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.6)" }}
          >
            <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 14, height: 14 }}>
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            GitHub
          </a>
        </div>

        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
          Deploy in 5 minutes · No credit card · MIT license
        </p>
      </motion.div>
    </section>
  )
}