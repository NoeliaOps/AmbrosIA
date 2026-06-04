import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/layout/page-header"
import { formatCurrency, formatShortDate } from "@/lib/utils"
import { ShoppingCart } from "lucide-react"

export const metadata: Metadata = { title: "Órdenes de Compra" }

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  pendiente: { label: "Pendiente", cls: "pill-draft"  },
  enviada:   { label: "Enviada",   cls: "pill-info"   },
  recibida:  { label: "Recibida",  cls: "pill-active" },
}

const STATUS_ORDER = ["pendiente", "enviada", "recibida"]

export default async function OrdeneCompraPage() {
  const supabase = await createClient()

  const { data: orders } = await supabase
    .from("purchase_orders")
    .select(`
      id, status, buy_by_date, received_at, subtotal,
      suppliers(name),
      events(id, name, event_date),
      purchase_order_items(id)
    `)
    .order("buy_by_date", { ascending: true, nullsFirst: false })

  const rows = orders ?? []
  const grouped = STATUS_ORDER.map((status) => ({
    status,
    items: rows.filter((r) => r.status === status),
  })).filter((g) => g.items.length > 0)

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Órdenes de Compra"
        description="Calendario de compras por proveedor"
      />

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-16 text-center space-y-3">
          <ShoppingCart size={32} className="mx-auto text-muted-foreground" />
          <p className="font-heading font-semibold">Sin órdenes de compra</p>
          <p className="text-sm font-sans text-muted-foreground">
            Las órdenes se generan desde la pestaña Requisición en el detalle de cada evento.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ status, items }) => {
            const cfg = STATUS_CFG[status]
            return (
              <div key={status} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`status-pill ${cfg.cls}`}>
                    <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "currentColor" }} />
                    {cfg.label}
                  </span>
                  <span className="text-xs font-sans text-muted-foreground">{items.length} orden{items.length !== 1 ? "es" : ""}</span>
                </div>
                <div className="rounded-md border border-border overflow-hidden">
                  <div className="grid grid-cols-[1fr_160px_120px_110px_100px] gap-2 px-4 py-2.5 bg-muted/40 text-xs font-sans font-semibold uppercase tracking-wider text-muted-foreground">
                    <span>Proveedor / Evento</span>
                    <span>Comprar antes del</span>
                    <span>Fecha evento</span>
                    <span className="text-right">Subtotal</span>
                    <span className="text-right">Ítems</span>
                  </div>
                  {items.map((po) => {
                    const supplier = po.suppliers as { name: string } | null
                    const event = po.events as { id: string; name: string; event_date: string } | null
                    const isOverdue = po.status === "pendiente" && po.buy_by_date && po.buy_by_date < today
                    return (
                      <Link
                        key={po.id}
                        href={`/eventos/${event?.id}?tab=requisicion`}
                        className="grid grid-cols-[1fr_160px_120px_110px_100px] gap-2 px-4 py-3 border-t border-border items-center hover:bg-muted/30 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-sm">{supplier?.name ?? "Sin proveedor"}</p>
                          <p className="text-xs font-sans text-muted-foreground truncate">{event?.name ?? "—"}</p>
                        </div>
                        <span className="text-sm font-sans" style={{ color: isOverdue ? "var(--status-danger)" : "var(--text-2)", fontWeight: isOverdue ? 600 : 400 }}>
                          {po.buy_by_date ? formatShortDate(po.buy_by_date) : "—"}
                          {isOverdue && " ⚠"}
                        </span>
                        <span className="text-sm font-sans text-muted-foreground">
                          {event?.event_date ? formatShortDate(event.event_date) : "—"}
                        </span>
                        <span className="text-sm font-sans tabular-nums text-right font-medium">
                          {formatCurrency(po.subtotal)}
                        </span>
                        <span className="text-sm font-sans tabular-nums text-right text-muted-foreground">
                          {(po.purchase_order_items ?? []).length}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Grand total */}
          <div className="flex justify-end">
            <div className="rounded-lg border border-border px-4 py-3 space-y-1 min-w-52">
              <p className="text-xs font-sans text-muted-foreground uppercase tracking-wider">Total general</p>
              <p className="text-xl font-heading font-bold tabular-nums">
                {formatCurrency(rows.reduce((s, r) => s + r.subtotal, 0))}
              </p>
              <p className="text-xs font-sans text-muted-foreground">
                {rows.filter((r) => r.status !== "recibida").length} pendiente{rows.filter((r) => r.status !== "recibida").length !== 1 ? "s" : ""} de recibir
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
