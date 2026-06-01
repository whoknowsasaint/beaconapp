import Button from "./Button"

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}) {
  return (
    <div
      className={[
        "flex flex-col items-center justify-center text-center",
        "py-16 px-6",
        className,
      ].join(" ")}
    >
      {icon && (
        <div className="h-12 w-12 rounded-xl bg-white/[0.04] border border-beacon-border flex items-center justify-center mb-4 text-beacon-text-faint">
          {icon}
        </div>
      )}

      <h3 className="text-sm font-medium text-beacon-text mb-1">
        {title}
      </h3>

      {description && (
        <p className="text-sm text-beacon-text-muted max-w-xs mb-6">
          {description}
        </p>
      )}

      {action && (
        <Button
          variant={action.variant ?? "primary"}
          size="sm"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}