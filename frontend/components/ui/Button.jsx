"use client"

import { forwardRef } from "react"

const SIZE = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
  lg: "h-11 px-6 text-sm gap-2",
}

const VARIANT = {
  primary: [
    "bg-beacon-blue text-white",
    "hover:bg-blue-500",
    "focus-visible:ring-2 focus-visible:ring-beacon-blue focus-visible:ring-offset-2 focus-visible:ring-offset-beacon-bg",
    "disabled:opacity-40 disabled:cursor-not-allowed",
  ].join(" "),

  secondary: [
    "bg-white/[0.06] text-beacon-text border border-beacon-border",
    "hover:bg-white/[0.10] hover:border-white/[0.14]",
    "focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-beacon-bg",
    "disabled:opacity-40 disabled:cursor-not-allowed",
  ].join(" "),

  ghost: [
    "text-beacon-text-muted",
    "hover:bg-white/[0.06] hover:text-beacon-text",
    "focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-beacon-bg",
    "disabled:opacity-40 disabled:cursor-not-allowed",
  ].join(" "),

  danger: [
    "bg-beacon-red/10 text-beacon-red border border-beacon-red/20",
    "hover:bg-beacon-red/20 hover:border-beacon-red/40",
    "focus-visible:ring-2 focus-visible:ring-beacon-red/40 focus-visible:ring-offset-2 focus-visible:ring-offset-beacon-bg",
    "disabled:opacity-40 disabled:cursor-not-allowed",
  ].join(" "),
}

const Button = forwardRef(function Button(
  {
    children,
    variant  = "primary",
    size     = "md",
    loading  = false,
    disabled = false,
    className = "",
    type     = "button",
    ...rest
  },
  ref
) {
  const isDisabled = disabled || loading

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={[
        "inline-flex items-center justify-center font-medium rounded-lg",
        "transition-colors duration-150",
        "outline-none",
        SIZE[size]    ?? SIZE.md,
        VARIANT[variant] ?? VARIANT.primary,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {loading ? (
        <>
          <Spinner size={size} />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  )
})

function Spinner({ size }) {
  const dim = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"
  return (
    <svg
      className={`${dim} animate-spin text-current`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12" cy="12" r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

export default Button