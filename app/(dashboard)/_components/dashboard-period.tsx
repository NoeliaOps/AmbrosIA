"use client"

import { useState } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Calendar } from "lucide-react"

const PRESETS = [
  { key: "month", label: "Este mes" },
  { key: "quarter", label: "Trimestre" },
  { key: "year", label: "Este año" },
  { key: "12m", label: "12 meses" },
] as const

export type PresetKey = (typeof PRESETS)[number]["key"]

export function DashboardPeriod({
  activePreset,
  from,
  to,
}: {
  activePreset: PresetKey | "custom"
  from: string
  to: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [customOpen, setCustomOpen] = useState(activePreset === "custom")
  const [fromVal, setFromVal] = useState(from)
  const [toVal, setToVal] = useState(to)

  function selectPreset(key: PresetKey) {
    setCustomOpen(false)
    const params = new URLSearchParams(searchParams.toString())
    params.set("preset", key)
    params.delete("from")
    params.delete("to")
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  function applyCustom() {
    if (!fromVal || !toVal) return
    if (fromVal > toVal) return
    const params = new URLSearchParams(searchParams.toString())
    params.set("preset", "custom")
    params.set("from", fromVal)
    params.set("to", toVal)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex items-center rounded-lg border border-border bg-card p-0.5">
        {PRESETS.map((p) => {
          const active = activePreset === p.key
          return (
            <button
              key={p.key}
              onClick={() => selectPreset(p.key)}
              className="rounded-md px-3 py-1.5 text-xs font-sans font-medium transition-colors"
              style={
                active
                  ? { background: "var(--text-1)", color: "var(--bg-card, #fff)" }
                  : { color: "var(--text-2)" }
              }
            >
              {p.label}
            </button>
          )
        })}
        <button
          onClick={() => setCustomOpen((o) => !o)}
          className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-sans font-medium transition-colors"
          style={
            activePreset === "custom"
              ? { background: "var(--text-1)", color: "var(--bg-card, #fff)" }
              : { color: "var(--text-2)" }
          }
        >
          <Calendar size={12} />
          Personalizado
        </button>
      </div>

      {customOpen && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
          <input
            type="date"
            value={fromVal}
            onChange={(e) => setFromVal(e.target.value)}
            className="h-7 rounded-md border border-border bg-background px-2 text-xs font-sans"
          />
          <span className="text-xs font-sans text-muted-foreground">a</span>
          <input
            type="date"
            value={toVal}
            onChange={(e) => setToVal(e.target.value)}
            className="h-7 rounded-md border border-border bg-background px-2 text-xs font-sans"
          />
          <button
            onClick={applyCustom}
            disabled={!fromVal || !toVal || fromVal > toVal}
            className="h-7 rounded-md px-3 text-xs font-sans font-medium text-white transition-colors disabled:opacity-50"
            style={{ background: "#2D2926" }}
          >
            Aplicar
          </button>
        </div>
      )}
    </div>
  )
}
