"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import AppFrame from "./AppFrame"

const FEATURES = [
  {
    id:          "monitoring",
    number:      "01",
    title:       "Real-time uptime monitoring",
    description: "HTTP, TCP, and ICMP checks every 30 seconds. Response time history, uptime percentages, and instant status transitions -- visible the moment something changes.",
    detail:      "Every check result is stored. 90 days of history, available instantly.",
  },
  {
    id:          "incidents",
    number:      "02",
    title:       "Structured incident management",
    description: "When a monitor fails, an incident opens automatically. Your team gets a shared timeline, status progression, and update feed to coordinate the response.",
    detail:      "Incidents auto-resolve when the monitor recovers. Duration tracked to the second.",
  },
  {
    id:          "status-pages",
    number:      "03",
    title:       "Branded public status pages",
    description: "One-click status pages at your own domain. Subscribers see live service health, uptime history, and active incidents the moment they happen.",
    detail:      "Multiple pages, custom branding, 90-day uptime bars per service.",
  },
  {
    id:          "notifications",
    number:      "04",
    title:       "Instant subscriber notifications",
    description: "Every incident dispatches to Telegram, Slack, and email simultaneously. Delivery logged per subscriber. Resolution notifications fire automatically.",
    detail:      "No missed alerts. Every delivery tracked, every failure surfaced.",
  },
]

export default function StickySection() {
  const [activeIndex, setActiveIndex] = useState(0)
  const sectionRefs = useRef([])

  useEffect(() => {
    const observers = FEATURES.map((_, i) => {
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveIndex(i) },
        { threshold: 0.5 }
      )
      if (sectionRefs.current[i]) obs.observe(sectionRefs.current[i])
      return obs
    })
    return () => observers.forEach(obs => obs.disconnect())
  }, [])

  return (
    <div style={{ display: "flex", alignItems: "flex-start" }}>
      <div
        style={{
          position:  "sticky",
          top:       0,
          width:     "58%",
          height:    "100vh",
          padding:   "24px 0 24px 24px",
          flexShrink: 0,
        }}
      >
        <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, minHeight: 0 }}>
            <AppFrame activeFeature={FEATURES[activeIndex].id} />
          </div>
        </div>
      </div>

      <div style={{ width: "42%", flexShrink: 0 }}>
        {FEATURES.map((feature, i) => (
          <div
            key={feature.id}
            ref={el => (sectionRefs.current[i] = el)}
            style={{
              height:         "100vh",
              display:        "flex",
              alignItems:     "center",
              padding:        "0 40px 0 48px",
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={i === activeIndex ? "active" : "idle"}
                initial={{ opacity: 0.4, y: 16 }}
                animate={{ opacity: i === activeIndex ? 1 : 0.35, y: 0 }}
                transition={{ duration: 0.35 }}
              >
                <div
                  style={{
                    fontSize:      11,
                    fontFamily:    "var(--font-mono)",
                    color:         i === activeIndex ? "rgba(59,130,246,0.9)" : "rgba(255,255,255,0.2)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom:  14,
                    display:       "flex",
                    alignItems:    "center",
                    gap:           8,
                  }}
                >
                  <span
                    style={{
                      width:        20,
                      height:       20,
                      borderRadius: "50%",
                      border:       `1.5px solid ${i === activeIndex ? "#3B82F6" : "rgba(255,255,255,0.15)"}`,
                      display:      "flex",
                      alignItems:   "center",
                      justifyContent: "center",
                      fontSize:     9,
                      fontWeight:   700,
                      color:        i === activeIndex ? "#3B82F6" : "rgba(255,255,255,0.3)",
                      transition:   "all 0.3s",
                    }}
                  >
                    {feature.number}
                  </span>
                  Feature
                </div>

                <h2
                  style={{
                    fontSize:   i === activeIndex ? 26 : 22,
                    fontWeight: 600,
                    color:      i === activeIndex ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.35)",
                    marginBottom: 14,
                    lineHeight: 1.2,
                    letterSpacing: "-0.01em",
                    transition: "all 0.3s",
                  }}
                >
                  {feature.title}
                </h2>

                {i === activeIndex && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
                    <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, marginBottom: 16 }}>
                      {feature.description}
                    </p>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", lineHeight: 1.6, fontStyle: "italic" }}>
                      {feature.detail}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  )
}