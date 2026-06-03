"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { EASE, DURATION, panelVariants } from "@/lib/motion"
import SceneWrapper from "@/components/scenes/shared/SceneWrapper"
import styles from "./TelegramScene.module.css"

const SIGNAL_PATH = "M 80 130 C 140 130 160 200 220 200"

function SignalPath({ inView, reducedMotion }) {
  return (
    <svg
      className={styles.signalSvg}
      viewBox="0 0 400 400"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <defs>
        <filter id="glow-tg">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <motion.path
        d={SIGNAL_PATH}
        fill="none"
        stroke="rgba(34,158,217,0.4)"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        filter="url(#glow-tg)"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={inView ? { pathLength: 1, opacity: 1 } : {}}
        transition={{
          pathLength: { duration: DURATION.draw, ease: EASE.entrance },
          opacity:    { duration: 0.3 },
        }}
      />

      {inView && !reducedMotion && (
        <motion.circle
          r="4"
          fill="#229ED9"
          filter="url(#glow-tg)"
          style={{ offsetPath: `path('${SIGNAL_PATH}')` }}
          animate={{ offsetDistance: ["0%", "100%"] }}
          transition={{
            duration:   3,
            ease:       "easeInOut",
            repeat:     Infinity,
            repeatType: "loop",
          }}
        />
      )}
    </svg>
  )
}

function NotificationBanner({ show, reducedMotion }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={styles.notifBanner}
          initial={{ y: reducedMotion ? 0 : -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{    y: reducedMotion ? 0 : -40, opacity: 0 }}
          transition={{ duration: 0.3, ease: EASE.entrance }}
        >
          <div className={styles.telegramDot} style={{ width: 14, height: 14 }}>
            <svg viewBox="0 0 16 16" fill="white" style={{ width: 8, height: 8 }}>
              <path d="M1.5 8l4.5 4.5 8-9" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: "9px", fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>
              Beacon Alerts
            </p>
            <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.5)" }}>
              New incident reported
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function PhoneMockup({ inView, reducedMotion }) {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    if (!inView || reducedMotion) return
    const show = setTimeout(() => setShowBanner(true),  1200)
    const hide = setTimeout(() => setShowBanner(false), 3400)
    return () => { clearTimeout(show); clearTimeout(hide) }
  }, [inView, reducedMotion])

  useEffect(() => {
    if (!inView || reducedMotion || showBanner) return
    const id = setInterval(() => {
      setShowBanner(true)
      setTimeout(() => setShowBanner(false), 2200)
    }, 6000)
    return () => clearInterval(id)
  }, [inView, reducedMotion, showBanner])

  return (
    <motion.div
      className={styles.phone}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: DURATION.entrance, ease: EASE.entrance, delay: 0.5 }}
      whileHover={reducedMotion ? {} : { rotateY: 3, translateZ: 8 }}
      style={{ perspective: 800 }}
    >
      <NotificationBanner show={showBanner} reducedMotion={reducedMotion} />

      <div className={styles.phoneNotch} />

      <div className={styles.phoneHeader}>
        <div className={styles.telegramDot}>
          <svg viewBox="0 0 16 16" fill="none" style={{ width: 10, height: 10 }}>
            <path d="M1 8l2.5 2.5 4-5L14 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <p style={{ fontSize: "9px", fontWeight: 600, color: "rgba(255,255,255,0.9)", lineHeight: 1 }}>
            Beacon Alerts
          </p>
          <p style={{ fontSize: "8px", color: "rgba(255,255,255,0.4)", marginTop: "1px" }}>
            bot
          </p>
        </div>
      </div>

      <div className={styles.phoneContent}>
        <div className={styles.messageCard}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px" }}>
            <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#EF4444" }} />
            <span style={{ fontSize: "9px", fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>
              CRITICAL
            </span>
          </div>
          <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.7)", lineHeight: 1.4, marginBottom: "4px" }}>
            API Gateway -- Elevated Error Rate
          </p>
          <p style={{ fontSize: "8px", color: "#229ED9" }}>
            View on Status Page →
          </p>
        </div>

        <div className={styles.messageCardOld}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "3px" }}>
            <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#22C55E" }} />
            <span style={{ fontSize: "9px", fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>
              RESOLVED
            </span>
          </div>
          <p style={{ fontSize: "8px", color: "rgba(255,255,255,0.4)" }}>
            API Gateway · 23m ago
          </p>
        </div>
      </div>
    </motion.div>
  )
}

function TelegramSceneInner({ inView = false, reducedMotion = false }) {
  return (
    <div className={styles.scene}>
      <div className={styles.glowTelegram} aria-hidden="true" />

      <SignalPath inView={inView} reducedMotion={reducedMotion} />

      <motion.div
        className={styles.originDot}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.3, ease: EASE.entrance }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="rgba(34,158,217,0.8)" strokeWidth="1.5" style={{ width: 14, height: 14 }}>
          <rect x="2" y="2" width="12" height="12" rx="3" />
          <path d="M5 8h6M8 5v6" strokeLinecap="round" />
        </svg>
      </motion.div>

      <PhoneMockup inView={inView} reducedMotion={reducedMotion} />
    </div>
  )
}

export default function TelegramScene() {
  return (
    <SceneWrapper
      ariaLabel="Telegram notification showing a Beacon incident alert for API Gateway being delivered to a phone."
      id="scene-telegram-visual"
    >
      <TelegramSceneInner />
    </SceneWrapper>
  )
}