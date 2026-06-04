import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/layout/page-header"
import { formatCurrency, formatShortDate } from "@/lib/utils"
import { FileText, ArrowRight } from "lucide-react"

export const metadata: Metadata = { title: "Cotizaciones" }

// Identidad del módulo (Comercial → índigo)
const ACCENT = "#4C4F8A"

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  borrador:  { label: "Borrador",  color: "#6B7280" },
  enviada:   { label: "Enviada",   color: "#3D5A80" },
  aprobada:  { label: "Aprobada",  color: "#2F6B4F" },
  rechazada: { label: "Rechazada", color: "#991B1B" },
}
// Orden de presentación: lo accionable primero
const GROUP_ORDER = ["aprobada", "enviada", "borrador", "rechazada"]

type QuoteRow = {
  id: string
  version_number: number
  status: string
  subtotal: number
  discount_amount: number
  total: number
  margin_percent: number | null
  created_at: string
  events: {
    id: string
    name: string
    event_date: string
    guest_count: number
    clients: { name: string } | null
  } | null
}

export default async function CotizacionesPage() {
  const supabase = await createClient()

  const { data: rawQuotes } = await supabase
    .from("quotes")
    .select(`id, version_number, status, subtotal, discount_amount, total, margin_percent, created_at,
      events(id, name, event_date, guest_count, clients(name))`)
    .order("created_at", { ascending: false })

  const quotes = (rawQuotes ?? []) as unknown as QuoteRow[]

  const totalValue = quotes.reduce((s, q) => s + q.total, 0)
  const aprobadas = quotes.filter((q) => q.status === "aprobada")
  const totalAprobado = aprobadas.reduce((s, q) => s + q.total, 0)
  const avgMargin = aprobadas.length
    ? Math.round(aprobadas.reduce((s, q) => s + (q.margin_percent ?? 0), 0) / aprobadas.length)
    : 0

  const grouped = GROUP_ORDER
    .map((status) => ({ status, items: quotes.filter((q) => q.status === status) }))
    .filter((g) => g.items.length > 0)

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Cotizaciones"
        description="Seguimiento de todas las cotizaciones generadas."
        meta={`${quotes.length} total`}
      />

      {quotes.length === 0 ? (
        <div className="enterprise-card p-16 text-center space-y-2">
          <FileText size={28} className="mx-auto text-muted-foreground/30" />
          <p className="text-sm font-sans text-muted-foreground">No hay cotizaciones aún.</p>
          <p className="text-xs font-sans text-muted-foreground/60">Genera una desde el detalle de un evento.</p>
        </div>
      ) : (
        <>
          {/* Resumen comercial */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Cotizaciones", value: String(quotes.length), sub: `${quotes.filter((q) => q.status === "enviada").length} enviadas`, accent: ACCENT },
              { label: "Aprobadas", value: String(aprobadas.length), sub: `${quotes.filter((q) => q.status === "rechazada").length} rechazadas`, accent: "#2F6B4F" },
              { label: "Valor aprobado", value: formatCurrency(totalAprobado), sub: `de ${formatCurrency(totalValue)}`, accent: "#2F6B4F" },
              { label: "Margen promedio", value: `${avgMargin}%`, sub: "en aprobadas", accent: ACCENT },
            ].map((kpi) => (
              <div key={kpi.label} className="enterprise-card p-3.5" style={{ borderLeft: `3px solid ${kpi.accent}` }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)" }}>{kpi.label}</p>
                <p className="mono-data" style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-1)", lineHeight: 1.15, marginTop: "0.15rem" }}>{kpi.value}</p>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.68rem", color: "var(--text-3)" }}>{kpi.sub}</p>
              </div>
            ))}
          </div>

          {/* Cotizaciones agrupadas por estado */}
          <div className="space-y-6">
            {grouped.map(({ status, items }) => {
              const cfg = STATUS_CFG[status]
              return (
                <section key={status}>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: cfg.color }} />
                    <h3 style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "1rem", fontWeight: 600, color: "var(--text-1)" }}>{cfg.label}</h3>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-3)" }}>{items.length}</span>
                    <span className="flex-1 h-px ml-1" style={{ background: "var(--border-def, #EBEBEC)" }} />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 stagger-children">
                    {items.map((q) => {
                      const ev = q.events
                      return (
                        <Link
                          key={q.id}
                          href={ev ? `/eventos/${ev.id}?tab=cotizacion` : "#"}
                          className="enterprise-card p-4 flex flex-col gap-3 table-row-hover group"
                          style={{ borderLeft: `3px solid ${cfg.color}` }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "1.05rem", fontWeight: 600, color: "var(--text-1)", lineHeight: 1.2 }} className="truncate">
                                {ev?.name ?? "—"}
                              </p>
                              <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", color: "var(--text-2)" }} className="truncate mt-0.5">
                                {ev?.clients?.name ?? "Sin cliente"}
                                {ev?.guest_count ? ` · ${ev.guest_count} inv.` : ""}
                                {ev?.event_date ? ` · ${formatShortDate(ev.event_date)}` : ""}
                              </p>
                            </div>
                            <span style={{
                              fontFamily: "var(--font-mono)", fontSize: "0.58rem", fontWeight: 600,
                              letterSpacing: "0.06em", color: ACCENT,
                              background: `color-mix(in srgb, ${ACCENT} 10%, white)`,
                              padding: "0.15rem 0.45rem", borderRadius: "4px", whiteSpace: "nowrap",
                            }} className="shrink-0">v{q.version_number}</span>
                          </div>

                          <div className="flex items-end justify-between gap-3 mt-auto pt-2" style={{ borderTop: "1px solid var(--border-def, #EBEBEC)" }}>
                            <div className="flex gap-5">
                              <div>
                                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)" }}>Total</p>
                                <p className="mono-data" style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-1)", lineHeight: 1.1 }}>{formatCurrency(q.total)}</p>
                                {q.discount_amount > 0 && (
                                  <p className="mono-data" style={{ fontSize: "0.62rem", color: "var(--text-3)" }}>−{formatCurrency(q.discount_amount)} desc.</p>
                                )}
                              </div>
                              {q.margin_percent != null && (
                                <div>
                                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)" }}>Margen</p>
                                  <p className="mono-data" style={{ fontSize: "1.15rem", fontWeight: 600, color: "var(--text-2)", lineHeight: 1.1 }}>{q.margin_percent}%</p>
                                </div>
                              )}
                            </div>
                            <ArrowRight size={15} className="text-muted-foreground/40 group-hover:text-gold-dark transition-colors" />
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </section>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
