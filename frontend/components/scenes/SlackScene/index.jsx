"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { EASE, DURATION, panelVariants } from "@/lib/motion"
import SceneWrapper from "@/components/scenes/shared/SceneWrapper"
import styles from "./SlackScene.module.css"

const CHANNELS = [
  { name: "#incidents",  active: false, unread: false },
  { name: "#ops-alerts", active: true,  unread: true  },
  { name: "#deployments",active: false, unread: false },
  { name: "#general",    active: false, unread: false },
]

const FIELDS = [
  { label: "Status",   value: "Investigating" },
  { label: "Severity", value: "Critical"      },
  { label: "Duration", value: "14m"           },
  { label: "Services", value: "API Gateway"   },
]

const REACTIONS = [
  { emoji: "🔴", count: 3 },
  { emoji: "✅", count: 1 },
  { emoji: "👀", count: 5 },
]

function Sidebar({ inView }) {
  return (
    <motion.div
      className={styles.sidebar}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 0.9 } : {}}
      transition={{ duration: 0.4, ease: EASE.entrance }}
      aria-hidden="true"
    >
      <p className={styles.sidebarTitle}>Acme Corp</p>
      {CHANNELS.map(ch => (
        <div
          key={ch.name}
          className={[
            styles.channel,
            ch.active ? styles.channelActive : "",
          ].join(" ")}
        >
          {ch.name}
          {ch.unread && (
            <motion.span
              className={styles.unreadDot}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </div>
      ))}
    </motion.div>
  )
}

function BlockKitMessage({ inView, reducedMotion }) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      className={styles.messageArea}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.4, ease: EASE.entrance, delay: 0.2 }}
    >
      <div className={styles.messageHeader}>
        <div className={styles.appIcon}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "white" }} />
        </div>
        <span style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>
          Beacon
        </span>
        <span style={{
          fontSize:      "9px",
          padding:       "1px 5px",
          borderRadius:  "3px",
          background:    "rgba(255,255,255,0.08)",
          color:         "rgba(255,255,255,0.4)",
          marginLeft:    "2px",
        }}>
          App
        </span>
        <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.25)", marginLeft: "auto", fontFamily: "var(--font-mono)" }}>
          3 min ago
        </span>
      </div>

      <motion.div
        className={styles.blockKitCard}
        initial={{ opacity: 0, y: 8 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: DURATION.normal, ease: EASE.entrance, delay: 0.35 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
          <span style={{ fontSize: "8px", color: "#EF4444" }}>●</span>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>
            CRITICAL -- API Gateway
          </p>
        </div>

        <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", marginBottom: "2px" }}>
          Elevated error rate detected. Automated incident opened.
        </p>

        <div className={styles.fieldsGrid}>
          {FIELDS.map(f => (
            <div key={f.label} className={styles.fieldItem}>
              <span style={{ fontSize: "9px", fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {f.label}
              </span>
              <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                {f.value}
              </span>
            </div>
          ))}
        </div>

        <div className={styles.threadRow}>
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 10, height: 10 }}>
            <path d="M1 1h10v7H1z" strokeLinejoin="round" />
            <path d="M3 10l2-2h2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          3 replies · View thread
        </div>

        <AnimatePresence>
          {hovered && (
            <motion.div
              className={styles.reactionBar}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{    opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
            >
              {REACTIONS.map(r => (
                <div key={r.emoji} className={styles.reaction}>
                  <span>{r.emoji}</span>
                  <span style={{ color: "rgba(255,255,255,0.5)" }}>{r.count}</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 0.45 } : {}}
        transition={{ duration: 0.3, delay: 0.7 }}
        style={{
          marginTop:  "8px",
          padding:    "6px 8px",
          borderRadius: "5px",
          background: "rgba(34,197,94,0.06)",
          borderLeft: "2px solid rgba(34,197,94,0.3)",
        }}
      >
        <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.35)" }}>
          ✅ Resolved · API Gateway · All systems operational
        </p>
      </motion.div>
    </motion.div>
  )
}

function SlackSceneInner({ inView = false, reducedMotion = false }) {
  return (
    <div className={styles.scene}>
      <div className={styles.glowSlack} aria-hidden="true" />

      <motion.div
        className={styles.workspace}
        variants={panelVariants}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
      >
        <Sidebar inView={inView} />
        <BlockKitMessage inView={inView} reducedMotion={reducedMotion} />
      </motion.div>
    </div>
  )
}

export default function SlackScene() {
  return (
    <SceneWrapper
      ariaLabel="Slack notification showing a Beacon critical incident alert for API Gateway in the ops-alerts channel with Block Kit message layout."
      id="scene-slack-visual"
    >
      <SlackSceneInner />
    </SceneWrapper>
  )
}