// ──────────────────────────────────────────────
// Beacon — Home Page (Phase 01 Component Test)
// Tests GlassPanel and SceneWrapper are working.
// ──────────────────────────────────────────────

"use client"

import { motion } from "framer-motion"
import GlassPanel from "@/components/scenes/shared/GlassPanel"
import SceneWrapper from "@/components/scenes/shared/SceneWrapper"
import { panelVariants, DURATION, EASE } from "@/lib/motion"
import { redirect } from "next/navigation"

export default function RootPage() {
  redirect("/login")
}
