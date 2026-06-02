import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/layout/page-header"
import { formatCurrency, formatShortDate } from "@/lib/utils"
import { FileText, TrendingUp, CheckCircle, Clock, ExternalLink } from "lucide-react"

export const metadata: Metadata = { title: "Cotizaciones" }

const STATUS_CFG: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  borrador:  { label: "Borrador",   dot: "bg-gray-400",    text: "text-gray-400",    bg: "" },
  enviada:   { label: "Enviada",    dot: "bg-blue-400",    text: "text-blue-400",    bg: "" },
  aprobada:  { label: "Aprobada",   dot: "bg-emerald-400", text: "text-emerald-400", bg: "" },
  rechazada: { label: "Rechazada",  dot: "bg-red-400",     text: "text-red-400",     bg: "" },
}

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

  const totalValue    = quotes.reduce((s, q) => s + q.total, 0)
  const aprobadas     = quotes.filter((q) => q.status === "aprobada")
  const totalAprobado = aprobadas.reduce((s, q) => s + q.total, 0)
  const avgMargin     = aprobadas.length
    ? Math.round(aprobadas.reduce((s, q) => s + (q.margin_percent ?? 0), 0) / aprobadas.length)
    : 0

  return (
    <div className="space-y-8 pb-8">
      <PageHeader
        title="Cotizaciones"
        description="Seguimiento de todas las cotizaciones generadas."
        meta={`${quotes.length} total`}
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 stagger-children">
        {[
          { label: "Total cotizaciones", value: String(quotes.length), sub: `${quotes.filter(q => q.status === "borrador").length} borradores · ${quotes.filter(q => q.status === "enviada").length} enviadas`, icon: FileText, accent: "gold" as const },
          { label: "Aprobadas",          value: String(aprobadas.length), sub: `${quotes.filter(q => q.status === "rechazada").length} rechazadas`, icon: CheckCircle, accent: "emerald" as const },
          { label: "Valor aprobado",     value: formatCurrency(totalAprobado), sub: `de ${formatCurrency(totalValue)} total`, icon: TrendingUp, accent: "emerald" as const },
          { label: "Margen promedio",    value: `${avgMargin}%`, sub: "En cotizaciones aprobadas", icon: Clock, accent: "gold" as const },
        ].map(({ label, value, sub, icon: Icon, accent }) => (
          <div key={label} className={`kpi-tile ${accent === "emerald" ? "border-l-emerald-500" : "border-l-gold"}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <p className="text-[11px] font-sans font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                <p className="text-2xl font-heading font-bold text-ink leading-none tabular">{value}</p>
                <p className="text-[11px] font-sans text-muted-foreground">{sub}</p>
              </div>
              <div className={`shrink-0 rounded-lg p-2 ${accent === "emerald" ? "bg-emerald-50 text-emerald-600" : "bg-gold/10 text-gold-dark"}`}>
                <Icon size={16} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="enterprise-card overflow-hidden">
        <div className="table-header px-4 py-2.5 grid grid-cols-12 gap-3">
          <span className="col-span-4 text-[11px] font-sans font-semibold uppercase tracking-wider text-muted-foreground">Evento / Cliente</span>
          <span className="col-span-2 text-[11px] font-sans font-semibold uppercase tracking-wider text-muted-foreground">Fecha</span>
          <span className="col-span-2 text-[11px] font-sans font-semibold uppercase tracking-wider text-muted-foreground text-right">Total</span>
          <span className="col-span-1 text-[11px] font-sans font-semibold uppercase tracking-wider text-muted-foreground text-center">Margen</span>
          <span className="col-span-2 text-[11px] font-sans font-semibold uppercase tracking-wider text-muted-foreground text-center">Estado</span>
          <span className="col-span-1" />
        </div>

        {quotes.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <FileText size={28} className="mx-auto text-muted-foreground/20" />
            <p className="text-sm font-sans text-muted-foreground">No hay cotizaciones aún.</p>
            <p className="text-xs font-sans text-muted-foreground/60">Genera una desde el detalle de un evento.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {quotes.map((q) => {
              const cfg = STATUS_CFG[q.status]
              const ev = q.events
              return (
                <Link key={q.id} href={ev ? `/eventos/${ev.id}?tab=cotizacion` : "#"}
                  className="grid grid-cols-12 gap-3 items-center px-4 py-3 table-row-hover">
                  <div className="col-span-4 min-w-0">
                    <p style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "0.9375rem", fontWeight: 500, color: "var(--text-1)", letterSpacing: "0.01em", lineHeight: 1.3 }} className="truncate">{ev?.name ?? "—"}</p>
                    <p style={{ fontFamily: "var(--font-sans), system-ui, sans-serif", fontSize: "0.7rem", color: "var(--text-2)" }} className="truncate mt-0.5">
                      {ev?.clients?.name ?? "Sin cliente"}
                      {ev?.guest_count ? ` · ${ev.guest_count} inv.` : ""}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="mono-data" style={{ fontSize: "0.8rem", color: "var(--text-2)" }}>{ev ? formatShortDate(ev.event_date) : "—"}</p>
                  </div>
                  <div className="col-span-2 text-right">
                    <p className="mono-data" style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-1)" }}>{formatCurrency(q.total)}</p>
                    {q.discount_amount > 0 && (
                      <p className="mono-data" style={{ fontSize: "0.65rem", color: "var(--text-3)" }}>-{formatCurrency(q.discount_amount)}</p>
                    )}
                  </div>
                  <div className="col-span-1 text-center">
                    <span className="mono-data" style={{ fontSize: "0.875rem", color: "var(--text-2)" }}>
                      {q.margin_percent != null ? `${q.margin_percent}%` : "—"}
                    </span>
                  </div>
                  <div className="col-span-2 flex justify-center">
                    {cfg && (
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 ${cfg.bg} ${cfg.text}`} style={{ fontFamily: "var(--font-cormorant), Georgia, serif", fontVariant: "small-caps", fontSize: "0.875rem", fontWeight: 600, letterSpacing: "0.04em" }}>
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    )}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <ExternalLink size={13} className="text-muted-foreground/40" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {quotes.length > 0 && (
          <div className="table-header px-4 py-2.5 flex items-center justify-between">
            <p className="text-xs font-sans text-muted-foreground">
              {aprobadas.length} de {quotes.length} cotizaciones aprobadas
            </p>
            <p className="text-xs font-sans font-semibold text-emerald-700 tabular">
              Valor aprobado: {formatCurrency(totalAprobado)}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
