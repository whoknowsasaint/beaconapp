"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { EASE, DURATION, panelVariants } from "@/lib/motion"
import SceneWrapper from "@/components/scenes/shared/SceneWrapper"
import styles from "./APIScene.module.css"

const CODE_LINES = [
  { parts: [
    { cls: "codeMethod", text: "POST" },
    { cls: "codePath",   text: " /api/v1/incidents" },
  ]},
  { parts: [
    { cls: "codeHeader", text: "Authorization:" },
    { cls: "codeValue",  text: " Bearer bk_live_••••Xk9m" },
  ]},
  { parts: [{ cls: "codePunct", text: "" }] },
  { parts: [{ cls: "codePunct", text: "{" }] },
  { parts: [
    { cls: "codePunct", text: '  ' },
    { cls: "codeKey",   text: '"title"' },
    { cls: "codePunct", text: ': ' },
    { cls: "codeValue", text: '"API Gateway degraded"' },
    { cls: "codePunct", text: "," },
  ]},
  { parts: [
    { cls: "codePunct", text: '  ' },
    { cls: "codeKey",   text: '"status"' },
    { cls: "codePunct", text: ': ' },
    { cls: "codeValue", text: '"investigating"' },
    { cls: "codePunct", text: "," },
  ]},
  { parts: [
    { cls: "codePunct", text: '  ' },
    { cls: "codeKey",   text: '"severity"' },
    { cls: "codePunct", text: ': ' },
    { cls: "codeValue", text: '"critical"' },
  ]},
  { parts: [{ cls: "codePunct", text: "}" }] },
]

function useTypewriter(lines, inView, reducedMotion) {
  const [visibleLines, setVisibleLines] = useState(reducedMotion ? lines.length : 0)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!inView) return
    if (reducedMotion) { setVisibleLines(lines.length); return }

    setVisibleLines(0)
    let current = 0

    function next() {
      current++
      setVisibleLines(current)
      if (current < lines.length) {
        timerRef.current = setTimeout(next, 80)
      }
    }

    timerRef.current = setTimeout(next, 400)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [inView, lines.length, reducedMotion])

  return visibleLines
}

function CodeLine({ line }) {
  return (
    <div className={styles.codeLine}>
      {line.parts.map((part, i) => (
        <span key={i} className={styles[part.cls]}>
          {part.text}
        </span>
      ))}
    </div>
  )
}

function ResponseCard({ show, reducedMotion }) {
  return (
    <motion.div
      className={styles.responseCard}
      initial={{ opacity: 0, x: 20 }}
      animate={show ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
      transition={{ duration: DURATION.normal, ease: EASE.entrance }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
        <span style={{
          fontSize:     "9px",
          fontWeight:   700,
          padding:      "1px 6px",
          borderRadius: "4px",
          background:   "rgba(34,197,94,0.15)",
          color:        "#22C55E",
          border:       "1px solid rgba(34,197,94,0.3)",
          boxShadow:    "0 0 8px rgba(34,197,94,0.2)",
          fontFamily:   "var(--font-mono)",
        }}>
          201 Created
        </span>
      </div>
      <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-mono)" }}>

        id: &quot;inc_xK9m...&quot;
      </p>
      <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-mono)" }}>

        status: &quot;investigating&quot;
      </p>
    </motion.div>
  )
}

function APISceneInner({ inView = false, reducedMotion = false }) {
  const visibleLines = useTypewriter(CODE_LINES, inView, reducedMotion)
  const showResponse = visibleLines >= CODE_LINES.length

  return (
    <div className={styles.scene}>
      <div className={styles.glowTerminal} aria-hidden="true" />
      <div className={styles.scanlines}    aria-hidden="true" />

      <div className={styles.panel} style={{ position: "relative" }}>
        <motion.div
          className={styles.terminalPanel}
          variants={panelVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          <div className={styles.terminalHeader}>
            {["API Keys", "Webhooks", "Docs"].map(t => (
              <span
                key={t}
                className={[
                  styles.terminalTab,
                  t === "API Keys" ? styles.terminalTabActive : "",
                ].join(" ")}
              >
                {t}
              </span>
            ))}
          </div>

          <div className={styles.keyRow}>
            <span className={styles.keyPrefix}>bk_live_</span>
            <span className={styles.keyObscured}>{"•".repeat(16)}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#22C55E" }}>Xk9m</span>
            <div className={styles.keyActions}>
              <span className={styles.keyBtn}>Reveal</span>
              <span className={styles.keyBtn}>Copy</span>
            </div>
          </div>

          <div className={styles.codeBlock}>
            {CODE_LINES.slice(0, visibleLines).map((line, i) => (
              <CodeLine key={i} line={line} />
            ))}
            {visibleLines < CODE_LINES.length && !reducedMotion && (
              <span
                style={{
                  display:     "inline-block",
                  width:       "6px",
                  height:      "12px",
                  background:  "#22C55E",
                  verticalAlign: "middle",
                  marginLeft:  "2px",
                  animation:   "cursorBlink 1s step-end infinite",
                }}
              />
            )}
          </div>
        </motion.div>

        <ResponseCard show={showResponse} reducedMotion={reducedMotion} />
      </div>
    </div>
  )
}

export default function APIScene() {
  return (
    <SceneWrapper
      ariaLabel="API key management showing a Beacon API key and example incident creation request with a 201 Created response."
      id="scene-api-visual"
    >
      <APISceneInner />
    </SceneWrapper>
  )
}
