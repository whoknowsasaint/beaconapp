export function Skeleton({ className = "" }) {
  return (
    <div
      className={[
        "rounded-md bg-white/[0.06] animate-pulse",
        className,
      ].join(" ")}
      aria-hidden="true"
    />
  )
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="w-full" role="status" aria-label="Loading...">
      <div className="flex gap-4 px-4 py-3 border-b border-beacon-border">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 px-4 py-4 border-b border-beacon-border"
        >
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton
              key={j}
              className={`h-3 flex-1 ${j === 0 ? "max-w-[140px]" : ""}`}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton({ className = "" }) {
  return (
    <div
      className={[
        "rounded-xl border border-beacon-border p-6 space-y-3",
        className,
      ].join(" ")}
      style={{ background: "var(--color-bg-elevated)" }}
      role="status"
      aria-label="Loading..."
    >
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  )
}

export default Skeleton