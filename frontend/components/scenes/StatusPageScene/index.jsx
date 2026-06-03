"use client"

import { motion, AnimatePresence } from "framer-motion"
import { EASE, DURATION, panelVariants, staggerContainerVariants, staggerChildVariants } from "@/lib/motion"
import SceneWrapper from "@/components/scenes/shared/SceneWrapper"
import styles from "./StatusPageScene.module.css"

const SERVICES = [
  { name: "API",            status: "operational", bars: 36 },
  { name: "Authentication", status: "operational", bars: 36 },
  { name: "CDN",            status: "operational", bars: 36 },
  { name: "Database",       status: "operational", bars: 36 },
]

const BAR_COLOR = { operational: "#22C55E", degraded: "#F59E0B", unknown: "#374151" }

function MiniBadge({ status }) {
  const color = status === "operational" ? "#22C55E" : "#F59E0B"
  const bg    = status === "operational" ? "rgba(34,197,94,0.12)" : "rgba(245,158,11,0.12)"
  const label = status === "operational" ? "Operational" : "Degraded"

  return (
    <span style={{
      display:      "inline-flex",
      alignItems:   "center",
      gap:          "4px",
      padding:      "1px 6px",
      borderRadius: "9999px",
      fontSize:     "8px",
      fontWeight:   500,
      background:   bg,
      color,
      flexShrink:   0,
    }}>
      <span style={{ width: 4, height: 4, borderRadius: "50%", background: color, display: "inline-block" }} />
      {label}
    </span>
  )
}

function StatusPageSceneInner({ inView = false, reducedMotion = false }) {
  return (
    <div className={styles.scene}>
      <div className={styles.glowTop}  aria-hidden="true" />
      <div className={styles.glowGreen} aria-hidden="true" />

      <div className={styles.browserWrapper}>
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={inView ? { scaleX: 1, opacity: 1 } : {}}
          style={{ transformOrigin: "left" }}
          transition={{ duration: 0.4, ease: EASE.entrance }}
        >
          <div className={styles.browserChrome}>
            <div className={styles.browserDots}>
              {["#FF5F57","#FEBC2E","#28C840"].map((c, i) => (
                <div key={i} className={styles.browserDot} style={{ background: c }} />
              ))}
            </div>
            <div className={styles.addressBar}>
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 8, height: 8, color: "rgba(255,255,255,0.3)" }}>
                <path d="M6 1a5 5 0 100 10A5 5 0 006 1z" />
                <path d="M6 1c-1.5 0-3 2-3 5s1.5 5 3 5M6 1c1.5 0 3 2 3 5s-1.5 5-3 5M1 6h10" strokeLinecap="round" />
              </svg>
              status.acme.com
            </div>
          </div>
        </motion.div>

        <motion.div
          className={styles.statusPageContent}
          variants={panelVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          transition={{ delay: 0.3 }}
          style={{ position: "relative" }}
        >
          <div className={styles.pageHeader}>
            <div className={styles.brandMark} style={{ background: "#3B82F6" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "white" }} />
            </div>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>
              Acme Corp
            </span>
          </div>

          <div className={styles.operationalRow}>
            <motion.span
              style={{ width: 9, height: 9, borderRadius: "50%", background: "#22C55E", display: "inline-block", flexShrink: 0 }}
              animate={!reducedMotion ? { opacity: [1, 0.5, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#22C55E" }}>
              All Systems Operational
            </span>
          </div>

          <motion.div
            variants={staggerContainerVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
          >
            {SERVICES.map(svc => (
              <motion.div
                key={svc.name}
                variants={staggerChildVariants}
                className={styles.serviceRow}
              >
                <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.7)", fontWeight: 500, flexShrink: 0, width: "80px" }}>
                  {svc.name}
                </span>
                <div className={styles.miniUptimeBars}>
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div
                      key={i}
                      className={styles.miniBar}
                      style={{ background: BAR_COLOR[svc.status] }}
                    />
                  ))}
                </div>
                <MiniBadge status={svc.status} />
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className={styles.subscribeTooltip}
            animate={!reducedMotion ? { y: [0, -4, 0] } : {}}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            initial={{ opacity: 0, x: 10 }}
            {...(inView ? { animate: { opacity: 1, x: 0, y: [0, -4, 0] } } : {})}
          >
            Get notified via Telegram or Email
          </motion.div>

          <div className={styles.beaconBadge}>
            Powered by Beacon
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function StatusPageScene() {
  return (
    <SceneWrapper
      ariaLabel="Public status page showing Acme Corp system status -- all systems operational with four services listed."
      id="scene-status-page-visual"
    >
      <StatusPageSceneInner />
    </SceneWrapper>
  )
}