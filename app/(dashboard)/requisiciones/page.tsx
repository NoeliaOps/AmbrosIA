import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/layout/page-header"
import { formatCurrency, formatShortDate } from "@/lib/utils"
import { ClipboardList, Package, ChevronRight, Check } from "lucide-react"

export const metadata: Metadata = { title: "Requisiciones" }

// Identidad del módulo (Abasto → teal)
const ACCENT = "#2C6E6A"

const FLOW = [
  { key: "generada", label: "Generada" },
  { key: "revisada", label: "Revisada" },
  { key: "aprobada", label: "Aprobada" },
] as const

export default async function RequisicionesPage() {
  const supabase = await createClient()

  const { data: requisitions } = await supabase
    .from("requisitions")
    .select(`
      id, status, created_at,
      events(id, name, event_date, guest_count),
      requisition_items(total_cost)
    `)
    .order("created_at", { ascending: false })

  const rows = (requisitions ?? []).map((r) => ({
    ...r,
    total: (r.requisition_items ?? []).reduce((s: number, i: { total_cost: number }) => s + i.total_cost, 0),
    itemCount: (r.requisition_items ?? []).length,
  }))

  const pendientes = rows.filter((r) => r.status !== "aprobada").length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Requisiciones"
        description="Explosión de recetas e insumos por evento"
        meta={pendientes > 0 ? `${pendientes} por aprobar` : undefined}
      />

      {rows.length === 0 ? (
        <div className="enterprise-card p-16 text-center space-y-3">
          <ClipboardList size={32} className="mx-auto text-muted-foreground/40" />
          <p className="font-heading font-semibold">Sin requisiciones</p>
          <p className="text-sm font-sans text-muted-foreground">
            Las requisiciones se generan desde la pestaña Requisición en el detalle de cada evento.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {rows.map((r) => {
            const ev = r.events as { id: string; name: string; event_date: string; guest_count: number } | null
            const currentStep = FLOW.findIndex((f) => f.key === r.status)
            const done = r.status === "aprobada"
            return (
              <Link
                key={r.id}
                href={`/eventos/${ev?.id}?tab=requisicion`}
                className="enterprise-card flex items-center gap-4 px-4 py-3.5 table-row-hover"
              >
                {/* Nodo de estado tipo checklist */}
                <div
                  className="shrink-0 grid place-items-center rounded-full"
                  style={{
                    height: "1.6rem", width: "1.6rem",
                    background: done ? ACCENT : "var(--card)",
                    color: done ? "#fff" : ACCENT,
                    boxShadow: done ? "none" : `inset 0 0 0 1.5px color-mix(in srgb, ${ACCENT} 45%, white)`,
                  }}
                >
                  {done ? <Check size={14} strokeWidth={3} /> : <ClipboardList size={13} />}
                </div>

                {/* Evento */}
                <div className="min-w-0 flex-1">
                  <p style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "0.95rem", fontWeight: 500, color: "var(--text-1)" }} className="truncate">
                    {ev?.name ?? "—"}
                  </p>
                  <p className="text-xs font-sans text-muted-foreground">
                    {ev?.event_date ? formatShortDate(ev.event_date) : "—"} · {ev?.guest_count} invitados
                  </p>
                </div>

                {/* Tracker de 3 pasos */}
                <div className="hidden md:flex items-center gap-1.5 shrink-0">
                  {FLOW.map((f, i) => {
                    const reached = i <= currentStep
                    return (
                      <div key={f.key} className="flex items-center gap-1.5">
                        <span style={{
                          fontFamily: "var(--font-mono)", fontSize: "0.58rem", fontWeight: 600,
                          letterSpacing: "0.06em", textTransform: "uppercase",
                          color: reached ? ACCENT : "var(--text-3)",
                          opacity: reached ? 1 : 0.5,
                        }}>{f.label}</span>
                        {i < FLOW.length - 1 && (
                          <span style={{ width: "1rem", height: "1.5px", background: i < currentStep ? ACCENT : "var(--surface-3, #EBEBEC)" }} />
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Ítems + total */}
                <div className="shrink-0 flex items-center gap-5">
                  <span className="hidden sm:flex items-center gap-1 text-sm mono-data" style={{ color: "var(--text-2)" }}>
                    <Package size={13} className="text-muted-foreground" /> {r.itemCount}
                  </span>
                  <div className="text-right" style={{ minWidth: "5rem" }}>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)" }}>Total est.</p>
                    <p className="mono-data" style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-1)" }}>{formatCurrency(r.total)}</p>
                  </div>
                  <ChevronRight size={15} className="text-muted-foreground/40" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
