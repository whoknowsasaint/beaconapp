"use client"

import { useState, useEffect } from "react"

function getSnapshot() {
  if (typeof window === "undefined") {
    return { isMobile: false, isTablet: false, isDesktop: true, width: 1200 }
  }
  const w = window.innerWidth
  return {
    isMobile:  w < 768,
    isTablet:  w >= 768 && w < 1024,
    isDesktop: w >= 1024,
    width:     w,
  }
}

export function useBreakpoint() {
  const [state, setState]     = useState(() => ({ ...getSnapshot(), mounted: false }))

  useEffect(() => {
    function update() {
      setState({ ...getSnapshot(), mounted: true })
    }

    update()

    window.addEventListener("resize", update)

    const mql = window.matchMedia("(max-width: 767px)")
    mql.addEventListener("change", update)

    return () => {
      window.removeEventListener("resize", update)
      mql.removeEventListener("change", update)
    }
  }, [])

  return state
}