"use client"

import { useState, useCallback, useRef } from "react"

let _dispatch = null

export function registerToastDispatch(fn) {
  _dispatch = fn
}

export function toast(message, type = "success", duration = 4000) {
  if (_dispatch) _dispatch({ message, type, duration })
}

export function useToastState() {
  const [toasts, setToasts]   = useState([])
  const counterRef             = useRef(0)

  const dispatch = useCallback(({ message, type, duration }) => {
    const id = ++counterRef.current
    setToasts(prev => [...prev, { id, message, type, duration }])

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  return { toasts, dispatch }
}