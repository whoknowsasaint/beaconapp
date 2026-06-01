"use client"

import { forwardRef } from "react"

const Input = forwardRef(function Input(
  {
    label,
    error,
    hint,
    id,
    className = "",
    containerClassName = "",
    type = "text",
    ...rest
  },
  ref
) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-")

  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-beacon-text"
        >
          {label}
        </label>
      )}

      <input
        ref={ref}
        id={inputId}
        type={type}
        className={[
          "h-9 w-full rounded-lg px-3 text-sm",
          "bg-white/[0.04] border border-beacon-border",
          "text-beacon-text placeholder:text-beacon-text-faint",
          "transition-colors duration-150",
          "hover:border-white/[0.14]",
          "focus:outline-none focus:border-beacon-blue focus:ring-1 focus:ring-beacon-blue",
          error
            ? "border-beacon-red/60 focus:border-beacon-red focus:ring-beacon-red"
            : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={
          error    ? `${inputId}-error` :
          hint     ? `${inputId}-hint`  :
          undefined
        }
        {...rest}
      />

      {error && (
        <p
          id={`${inputId}-error`}
          className="text-xs text-beacon-red"
          role="alert"
        >
          {error}
        </p>
      )}

      {hint && !error && (
        <p
          id={`${inputId}-hint`}
          className="text-xs text-beacon-text-faint"
        >
          {hint}
        </p>
      )}
    </div>
  )
})

export default Input