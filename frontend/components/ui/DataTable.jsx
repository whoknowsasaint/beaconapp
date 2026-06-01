"use client"

import { TableSkeleton } from "./LoadingSkeleton"
import EmptyState from "./EmptyState"

export default function DataTable({
  columns,
  rows,
  loading    = false,
  emptyTitle = "No results",
  emptyDescription,
  emptyAction,
  keyField   = "id",
  className  = "",
}) {
  if (loading) {
    return (
      <div
        className={[
          "rounded-xl border border-beacon-border overflow-hidden",
          className,
        ].join(" ")}
        style={{ background: "var(--color-bg-elevated)" }}
      >
        <TableSkeleton rows={5} cols={columns.length} />
      </div>
    )
  }

  if (!rows || rows.length === 0) {
    return (
      <div
        className={[
          "rounded-xl border border-beacon-border overflow-hidden",
          className,
        ].join(" ")}
        style={{ background: "var(--color-bg-elevated)" }}
      >
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      </div>
    )
  }

  return (
    <div
      className={[
        "rounded-xl border border-beacon-border overflow-hidden",
        className,
      ].join(" ")}
      style={{ background: "var(--color-bg-elevated)" }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-beacon-border">
              {columns.map(col => (
                <th
                  key={col.key}
                  className={[
                    "px-4 py-3 text-left text-xs font-medium text-beacon-text-faint uppercase tracking-wider",
                    col.headerClassName ?? "",
                  ].join(" ")}
                  style={{ width: col.width }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, rowIdx) => (
              <tr
                key={row[keyField] ?? rowIdx}
                className="border-b border-beacon-border last:border-0 hover:bg-white/[0.02] transition-colors"
              >
                {columns.map(col => (
                  <td
                    key={col.key}
                    className={[
                      "px-4 py-3 text-beacon-text-muted",
                      col.cellClassName ?? "",
                    ].join(" ")}
                  >
                    {col.render
                      ? col.render(row[col.key], row)
                      : (row[col.key] ?? "--")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}