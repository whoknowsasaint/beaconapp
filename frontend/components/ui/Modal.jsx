"use client"

import { useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
  className = "",
}) {
  const overlayRef = useRef(null)

  const widths = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  }

  useEffect(() => {
    if (!open) return

    function onKey(e) {
      if (e.key === "Escape") onClose()
    }

    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [open, onClose])

  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={overlayRef}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={handleOverlayClick}
          aria-modal="true"
          role="dialog"
          aria-labelledby={title ? "modal-title" : undefined}
        >
          <motion.div
            className={[
              "glass-panel relative rounded-2xl w-full",
              widths[size] ?? widths.md,
              className,
            ].join(" ")}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1,    y: 0 }}
            exit={{    opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="p-6">
              {title && (
                <div className="mb-5">
                  <h2
                    id="modal-title"
                    className="text-base font-semibold text-beacon-text"
                  >
                    {title}
                  </h2>
                  {description && (
                    <p className="text-sm text-beacon-text-muted mt-1">
                      {description}
                    </p>
                  )}
                </div>
              )}

              {children}
            </div>

            <button
              onClick={onClose}
              className="absolute top-4 right-4 h-7 w-7 rounded-lg flex items-center justify-center text-beacon-text-faint hover:text-beacon-text hover:bg-white/[0.06] transition-colors"
              aria-label="Close modal"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
                <line x1="4" y1="4" x2="12" y2="12" strokeLinecap="round" />
                <line x1="12" y1="4" x2="4"  y2="12" strokeLinecap="round" />
              </svg>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}