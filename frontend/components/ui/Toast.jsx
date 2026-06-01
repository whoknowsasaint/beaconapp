"use client"

import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useToastState, registerToastDispatch } from "@/lib/useToast"

const ICONS = {
  success: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4 text-beacon-green">
      <circle cx="8" cy="8" r="6.5" />
      <polyline points="5,8 7,10.5 11,6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4 text-beacon-red">
      <circle cx="8" cy="8" r="6.5" />
      <line x1="10" y1="6" x2="6" y2="10" strokeLinecap="round" />
      <line x1="6"  y1="6" x2="10" y2="10" strokeLinecap="round" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4 text-beacon-blue">
      <circle cx="8" cy="8" r="6.5" />
      <line x1="8" y1="7" x2="8" y2="11" strokeLinecap="round" />
      <circle cx="8" cy="5" r="0.5" fill="currentColor" strokeWidth="0" />
    </svg>
  ),
}

function ToastItem({ toast }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0,  scale: 1    }}
      exit={{    opacity: 0, y: 16, scale: 0.96 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="glass-panel flex items-start gap-3 px-4 py-3 rounded-xl min-w-[260px] max-w-sm shadow-glass"
    >
      <span className="flex-shrink-0 mt-0.5">
        {ICONS[toast.type] ?? ICONS.info}
      </span>
      <p className="text-sm text-beacon-text leading-snug">
        {toast.message}
      </p>
    </motion.div>
  )
}

export default function ToastContainer() {
  const { toasts, dispatch } = useToastState()

  useEffect(() => {
    registerToastDispatch(dispatch)
  }, [dispatch])

  return (
    <div
      className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 items-end"
      aria-live="polite"
      aria-atomic="false"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  )
}