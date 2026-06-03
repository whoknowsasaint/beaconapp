"use client"

import { motion, AnimatePresence } from "framer-motion"
import { EASE, DURATION, panelVariants } from "@/lib/motion"
import GlassPanel from "@/components/scenes/shared/GlassPanel"
import SceneWrapper from "@/components/scenes/shared/SceneWrapper"
import styles from "./IncidentScene.module.css"

const STEPS = [
  { label: "Investigating", active: true,  done: false, color: "#EF4444" },
  { label: "Identified",    active: false, done: false, color: "#F59E0B" },
  { label: "Monitoring",    active: false, done: false, color: "#3B82F6" },
  { label: "Resolved",      active: false, done: false, color: "#22C55E" },
]

const UPDATES = [
  {
    initials: "AK",
    status:   "Investigating",
    message:  "We are investigating elevated error rates on the API Gateway.",
    time:     "09:44",
  },
  {
    initials: "SY",
    status:   "Investigating",
    message:  "Root cause identified as a misconfigured load balancer rule.",
    time:     "09:51",
  },
  {
    initials: "AK",
    status:   "Monitoring",
    message:  "Fix deployed. Monitoring traffic patterns for full recovery.",
    time:     "10:03",
  },
]

function ProgressStepper({ inView, reducedMotion }) {
  return (
    <div className={styles.stepperTrack}>
      {STEPS.map((step, i) => (
        <motion.div
          key={step.label}
          style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}
        >
          <div className={styles.stepItem}>
            <motion.div
              className={styles.stepDot}
              initial={{ borderColor: "rgba(255,255,255,0.12)", backgroundColor: "transparent" }}
              animate={inView ? {
                borderColor:     step.active ? step.color : "rgba(255,255,255,0.12)",
                backgroundColor: step.active ? `${step.color}20` : "transparent",
              } : {}}
              transition={{ duration: 0.3, delay: i * 0.1 }}
            >
              <motion.div
                style={{ width: "7px", height: "7px", borderRadius: "50%" }}
                initial={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                animate={inView ? {
                  backgroundColor: step.active ? step.color : "rgba(255,255,255,0.15)",
                } : {}}
                transition={{ duration: 0.3, delay: i * 0.1 }}
              />
            </motion.div>
            <span
              className={styles.stepLabel}
              style={{
                color: step.active
                  ? "rgba(255,255,255,0.9)"
                  : "rgba(255,255,255,0.3)",
              }}
            >
              {step.label}
            </span>
          </div>

          {i < STEPS.length - 1 && (
            <motion.div
              className={styles.stepperConnector}
              initial={{ backgroundColor: "rgba(255,255,255,0.08)" }}
              animate={inView ? {
                backgroundColor: "rgba(255,255,255,0.08)",
              } : {}}
              style={{ flex: 1, height: "1px", margin: "0 4px", marginBottom: "20px" }}
            />
          )}
        </motion.div>
      ))}
    </div>
  )
}

function UpdateEntry({ update, index, inView, reducedMotion }) {
  return (
    <motion.div
      className={styles.updateEntry}
      initial={{ opacity: 0, x: -8 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{
        duration: DURATION.normal,
        ease:     EASE.entrance,
        delay:    0.4 + index * 0.12,
      }}
    >
      <div className={styles.avatar}>{update.initials}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
          <span style={{ fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
            {update.initials}
          </span>
          <span style={{
            fontSize:      "9px",
            padding:       "1px 6px",
            borderRadius:  "9999px",
            background:    "rgba(239,68,68,0.12)",
            color:         "#EF4444",
            border:        "1px solid rgba(239,68,68,0.2)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            fontWeight:    500,
          }}>
            {update.status}
          </span>
          <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.25)", marginLeft: "auto", fontFamily: "var(--font-mono)" }}>
            {update.time}
          </span>
        </div>
        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
          {update.message}
        </p>
      </div>
    </motion.div>
  )
}

function NotificationCard({ platform, color, count, channel, top, delay, inView, reducedMotion }) {
  return (
    <motion.div
      className={styles.notifCard}
      style={{ top }}
      initial={{ opacity: 0, x: 20 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{
        duration: DURATION.normal,
        ease:     EASE.entrance,
        delay,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
        <div style={{
          width:        "6px",
          height:       "20px",
          borderRadius: "3px",
          background:   color,
          flexShrink:   0,
        }} />
        <span style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>
          {platform}
        </span>
      </div>
      <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-mono)" }}>
        {count} subscribers notified
      </p>
      {channel && (
        <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", marginTop: "2px" }}>
          {channel}
        </p>
      )}
    </motion.div>
  )
}

function IncidentSceneInner({ inView = false, reducedMotion = false }) {
  return (
    <div className={styles.scene}>
      <div className={styles.glowRed} aria-hidden="true" />

      <div className={styles.panel} style={{ position: "relative" }}>
        <GlassPanel
          glow="#EF4444"
          glowOpacity={0.08}
          glowSize={380}
          className="p-5"
          as={motion.div}
          variants={panelVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
            <div>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.9)", marginBottom: "4px" }}>
                API Gateway -- Elevated Error Rate
              </p>
              <span style={{
                display:       "inline-flex",
                alignItems:    "center",
                gap:           "5px",
                padding:       "2px 8px",
                borderRadius:  "9999px",
                fontSize:      "10px",
                fontWeight:    600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                background:    "rgba(239,68,68,0.12)",
                color:         "#EF4444",
                border:        "1px solid rgba(239,68,68,0.25)",
                boxShadow:     "0 0 12px rgba(239,68,68,0.25)",
              }}>
                <motion.span
                  style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#EF4444", display: "inline-block" }}
                  animate={!reducedMotion ? { opacity: [1, 0.4, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                Critical
              </span>
            </div>
          </div>

          <ProgressStepper inView={inView} reducedMotion={reducedMotion} />

          <div>
            <p style={{ fontSize: "10px", fontWeight: 500, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
              Updates
            </p>
            {UPDATES.map((u, i) => (
              <UpdateEntry
                key={i}
                update={u}
                index={i}
                inView={inView}
                reducedMotion={reducedMotion}
              />
            ))}
          </div>
        </GlassPanel>

        <NotificationCard
          platform="Telegram"
          color="#229ED9"
          count={847}
          channel={null}
          top="20px"
          delay={0.7}
          inView={inView}
          reducedMotion={reducedMotion}
        />
        <NotificationCard
          platform="Slack"
          color="#4A154B"
          count={null}
          channel="#ops-alerts"
          top="90px"
          delay={0.85}
          inView={inView}
          reducedMotion={reducedMotion}
        />
      </div>
    </div>
  )
}

export default function IncidentScene() {
  return (
    <SceneWrapper
      ariaLabel="Incident management panel showing a critical API Gateway incident in investigating state with team updates and subscriber notifications."
      id="scene-incident-visual"
    >
      <IncidentSceneInner />
    </SceneWrapper>
  )
}