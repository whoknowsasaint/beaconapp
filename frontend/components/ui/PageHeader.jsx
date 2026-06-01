export default function PageHeader({
  title,
  description,
  action,
  className = "",
}) {
  return (
    <div
      className={[
        "flex items-start justify-between gap-4 mb-8",
        className,
      ].join(" ")}
    >
      <div>
        <h1 className="text-xl font-semibold text-beacon-text mb-1 tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-beacon-text-muted">
            {description}
          </p>
        )}
      </div>

      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  )
}