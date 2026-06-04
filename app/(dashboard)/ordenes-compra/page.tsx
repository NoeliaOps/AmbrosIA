import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/layout/page-header"
import { formatCurrency, formatShortDate } from "@/lib/utils"
import { ShoppingCart, Circle, CircleDot, CheckCircle2, AlertTriangle } from "lucide-react"

export const metadata: Metadata = { title: "Órdenes de Compra" }

// Identidad del módulo (Abasto → arcilla)
const ACCENT = "#9A5B3F"

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  pendiente: { label: "Por comprar", cls: "pill-draft" },
  enviada:   { label: "Enviada",     cls: "pill-info" },
  recibida:  { label: "Recibida",    cls: "pill-active" },
}
const STATUS_ORDER = ["pendiente", "enviada", "recibida"]
const STATUS_ICON = { pendiente: Circle, enviada: CircleDot, recibida: CheckCircle2 } as const

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
  const porRecibir = rows.filter((r) => r.status !== "recibida").length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Órdenes de Compra"
        description="Lista de compras por proveedor"
        meta={porRecibir > 0 ? `${porRecibir} por recibir` : undefined}
      />

      {rows.length === 0 ? (
        <div className="enterprise-card p-16 text-center space-y-3">
          <ShoppingCart size={32} className="mx-auto text-muted-foreground/40" />
          <p className="font-heading font-semibold">Sin órdenes de compra</p>
          <p className="text-sm font-sans text-muted-foreground">
            Las órdenes se generan desde la pestaña Requisición en el detalle de cada evento.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ status, items }) => {
            const cfg = STATUS_CFG[status]
            const Icon = STATUS_ICON[status as keyof typeof STATUS_ICON]
            const isDone = status === "recibida"
            return (
              <section key={status}>
                <div className="flex items-center gap-2 mb-2.5">
                  <Icon size={15} style={{ color: isDone ? "#166534" : ACCENT }} />
                  <h3 style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "1rem", fontWeight: 600, color: "var(--text-1)" }}>
                    {cfg.label}
                  </h3>
                  <span className="text-xs font-sans text-muted-foreground">{items.length} orden{items.length !== 1 ? "es" : ""}</span>
                </div>

                <div className="space-y-2">
                  {items.map((po) => {
                    const supplier = po.suppliers as { name: string } | null
                    const event = po.events as { id: string; name: string; event_date: string } | null
                    const isOverdue = po.status === "pendiente" && !!po.buy_by_date && po.buy_by_date < today
                    return (
                      <Link
                        key={po.id}
                        href={`/eventos/${event?.id}?tab=requisicion`}
                        className="enterprise-card flex items-center gap-4 px-4 py-3 table-row-hover"
                        style={isOverdue ? { borderColor: "color-mix(in srgb, #991B1B 30%, white)", background: "color-mix(in srgb, #991B1B 4%, white)" } : undefined}
                      >
                        {/* Casilla de estado */}
                        <div
                          className="shrink-0 grid place-items-center rounded-full"
                          style={{
                            height: "1.5rem", width: "1.5rem",
                            background: isDone ? "#166534" : "var(--card)",
                            color: isDone ? "#fff" : ACCENT,
                            boxShadow: isDone ? "none" : `inset 0 0 0 1.5px color-mix(in srgb, ${ACCENT} 45%, white)`,
                          }}
                        >
                          {isDone ? <CheckCircle2 size={14} /> : <Icon size={13} />}
                        </div>

                        {/* Proveedor / evento */}
                        <div className="min-w-0 flex-1">
                          <p style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "0.95rem", fontWeight: 500, color: "var(--text-1)" }} className="truncate">
                            {supplier?.name ?? "Sin proveedor"}
                          </p>
                          <p className="text-xs font-sans text-muted-foreground truncate">{event?.name ?? "—"}</p>
                        </div>

                        {/* Comprar antes del */}
                        <div className="hidden sm:block text-right shrink-0" style={{ minWidth: "7rem" }}>
                          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)" }}>
                            {isOverdue ? "Vencida" : "Comprar antes"}
                          </p>
                          <p className="mono-data flex items-center justify-end gap-1" style={{ fontSize: "0.82rem", fontWeight: isOverdue ? 700 : 500, color: isOverdue ? "#991B1B" : "var(--text-2)" }}>
                            {isOverdue && <AlertTriangle size={12} />}
                            {po.buy_by_date ? formatShortDate(po.buy_by_date) : "—"}
                          </p>
                        </div>

                        {/* Subtotal + ítems */}
                        <div className="text-right shrink-0" style={{ minWidth: "5.5rem" }}>
                          <p className="mono-data" style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--text-1)" }}>{formatCurrency(po.subtotal)}</p>
                          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-3)" }}>{(po.purchase_order_items ?? []).length} ítems</p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )
          })}

          {/* Total general */}
          <div className="flex justify-end">
            <div className="enterprise-card px-5 py-3.5 text-right" style={{ borderTop: `2px solid ${ACCENT}` }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)" }}>Total general</p>
              <p className="mono-data" style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text-1)", lineHeight: 1.1 }}>
                {formatCurrency(rows.reduce((s, r) => s + r.subtotal, 0))}
              </p>
              <p className="text-xs font-sans text-muted-foreground">
                {porRecibir} pendiente{porRecibir !== 1 ? "s" : ""} de recibir
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
