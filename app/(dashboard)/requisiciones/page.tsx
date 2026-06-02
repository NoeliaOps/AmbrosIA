import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { ClipboardList, Package } from "lucide-react"

export const metadata: Metadata = { title: "Requisiciones" }

const STATUS_CFG: Record<string, { label: string; className: string }> = {
  generada: { label: "Generada", className: "bg-blue-100 text-blue-800 border-blue-200" },
  revisada: { label: "Revisada", className: "bg-amber-100 text-amber-800 border-amber-200" },
  aprobada: { label: "Aprobada", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
}

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Requisiciones"
        description="Explosión de recetas e insumos por evento"
      />

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-16 text-center space-y-3">
          <ClipboardList size={32} className="mx-auto text-muted-foreground" />
          <p className="font-heading font-semibold">Sin requisiciones</p>
          <p className="text-sm font-sans text-muted-foreground">
            Las requisiciones se generan desde la pestaña Requisición en el detalle de cada evento.
          </p>
        </div>
      ) : (
        <div className="rounded-md border border-border overflow-hidden">
          <div className="grid grid-cols-[1fr_140px_90px_110px_120px] gap-2 px-4 py-2.5 bg-muted/40 text-xs font-sans font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Evento</span>
            <span>Fecha evento</span>
            <span className="text-right">Ítems</span>
            <span className="text-right">Total est.</span>
            <span>Estado</span>
          </div>
          {rows.map((r) => {
            const ev = r.events as { id: string; name: string; event_date: string; guest_count: number } | null
            const cfg = STATUS_CFG[r.status] ?? { label: r.status, className: "" }
            return (
              <Link
                key={r.id}
                href={`/eventos/${ev?.id}?tab=requisicion`}
                className="grid grid-cols-[1fr_140px_90px_110px_120px] gap-2 px-4 py-3 border-t border-border items-center hover:bg-muted/30 transition-colors"
              >
                <div>
                  <p className="font-medium text-sm">{ev?.name ?? "—"}</p>
                  <p className="text-xs font-sans text-muted-foreground">{ev?.guest_count} invitados</p>
                </div>
                <span className="text-sm font-sans text-muted-foreground">
                  {ev?.event_date ? formatDate(ev.event_date) : "—"}
                </span>
                <span className="text-sm font-sans tabular-nums text-right flex items-center justify-end gap-1">
                  <Package size={13} className="text-muted-foreground" />
                  {r.itemCount}
                </span>
                <span className="text-sm font-sans tabular-nums text-right font-medium">
                  {formatCurrency(r.total)}
                </span>
                <Badge variant="secondary" className={`font-sans text-xs border w-fit ${cfg.className}`}>
                  {cfg.label}
                </Badge>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
