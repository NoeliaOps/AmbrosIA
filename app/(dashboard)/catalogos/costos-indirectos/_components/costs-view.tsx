"use client"

import { useState } from "react"
import { IndirectCostClient } from "./indirect-cost-client"
import { OverheadClient, type OverheadRow } from "./overhead-client"

type Props = {
  costs: Parameters<typeof IndirectCostClient>[0]["costs"]
  overhead: OverheadRow[]
  eventCounts: Record<string, number>
}

export function CostsView({ costs, overhead, eventCounts }: Props) {
  const [view, setView] = useState<"gastos" | "reglas">("gastos")
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-1 p-1 rounded-lg w-fit" style={{ background: "var(--surface-2, #F4F4F5)" }}>
        {([["gastos", "Gastos generales"], ["reglas", "Reglas por evento"]] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setView(k)}
            className="px-3.5 py-1.5 rounded-md text-xs font-sans font-medium transition-colors"
            style={view === k
              ? { background: "var(--card, #fff)", color: "var(--text-1)", boxShadow: "0 1px 2px rgb(0 0 0 / 0.06)" }
              : { color: "var(--text-3)" }}
          >
            {label}
          </button>
        ))}
      </div>

      {view === "gastos"
        ? <OverheadClient overhead={overhead} eventCounts={eventCounts} />
        : <IndirectCostClient costs={costs} />}
    </div>
  )
}
