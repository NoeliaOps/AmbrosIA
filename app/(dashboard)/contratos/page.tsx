import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/layout/page-header"
import { formatCurrency, formatShortDate } from "@/lib/utils"
import { FileSignature, CheckCircle2, Clock, Send, ExternalLink } from "lucide-react"

export const metadata: Metadata = { title: "Contratos" }

const STATUS_CFG: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  borrador:  { label: "Borrador",   dot: "bg-gray-400",    text: "text-gray-600",    bg: "bg-gray-100" },
  enviado:   { label: "Enviado",    dot: "bg-blue-400",    text: "text-blue-700",    bg: "bg-blue-50"  },
  firmado:   { label: "Firmado",    dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
  cancelado: { label: "Cancelado",  dot: "bg-red-400",     text: "text-red-600",     bg: "bg-red-50"   },
}

type ContractRow = {
  id: string
  status: string
  created_at: string
  signed_at: string | null
  events: { id: string; name: string; event_date: string; clients: { name: string } | null } | null
  quotes: { total: number } | null
}

export default async function ContratosPage() {
  const supabase = await createClient()

  const { data: rawContracts } = await supabase
    .from("contracts")
    .select(`id, status, created_at, signed_at,
      events(id, name, event_date, clients(name)),
      quotes(total)`)
    .order("created_at", { ascending: false })

  const contracts  = (rawContracts ?? []) as unknown as ContractRow[]
  const firmados   = contracts.filter((c) => c.status === "firmado")
  const borradores = contracts.filter((c) => c.status === "borrador")
  const enviados   = contracts.filter((c) => c.status === "enviado")
  const totalFirmado = firmados.reduce((s, c) => s + (c.quotes?.total ?? 0), 0)

  return (
    <div className="space-y-8 pb-8">
      <PageHeader
        title="Contratos"
        description="Contratos generados a partir de cotizaciones aprobadas."
        meta={`${contracts.length} total`}
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 stagger-children">
        {[
          { label: "Total contratos",  value: String(contracts.length), sub: "Todos los eventos", icon: FileSignature, accent: "gold" as const },
          { label: "Firmados",         value: String(firmados.length),  sub: formatCurrency(totalFirmado), icon: CheckCircle2, accent: "emerald" as const },
          { label: "Enviados",         value: String(enviados.length),  sub: "Pendientes de firma", icon: Send, accent: "blue" as const },
          { label: "Borradores",       value: String(borradores.length), sub: "Sin enviar al cliente", icon: Clock, accent: "gold" as const },
        ].map(({ label, value, sub, icon: Icon, accent }) => {
          const borderClass = { gold: "border-l-gold", emerald: "border-l-emerald-500", blue: "border-l-blue-500" }[accent]
          const iconClass   = { gold: "bg-gold/10 text-gold-dark", emerald: "bg-emerald-50 text-emerald-600", blue: "bg-blue-50 text-blue-600" }[accent]
          return (
            <div key={label} className={`kpi-tile ${borderClass}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 min-w-0">
                  <p className="text-[11px] font-sans font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                  <p className="text-2xl font-heading font-bold text-ink leading-none tabular">{value}</p>
                  <p className="text-[11px] font-sans text-muted-foreground">{sub}</p>
                </div>
                <div className={`shrink-0 rounded-lg p-2 ${iconClass}`}><Icon size={16} /></div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Table */}
      <div className="enterprise-card overflow-hidden">
        <div className="table-header px-4 py-2.5 grid grid-cols-12 gap-3">
          <span className="col-span-4 text-[11px] font-sans font-semibold uppercase tracking-wider text-muted-foreground">Evento / Cliente</span>
          <span className="col-span-2 text-[11px] font-sans font-semibold uppercase tracking-wider text-muted-foreground">Fecha evento</span>
          <span className="col-span-2 text-[11px] font-sans font-semibold uppercase tracking-wider text-muted-foreground text-right">Valor</span>
          <span className="col-span-2 text-[11px] font-sans font-semibold uppercase tracking-wider text-muted-foreground text-center">Creado</span>
          <span className="col-span-1 text-[11px] font-sans font-semibold uppercase tracking-wider text-muted-foreground text-center">Estado</span>
          <span className="col-span-1" />
        </div>

        {contracts.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <FileSignature size={28} className="mx-auto text-muted-foreground/20" />
            <p className="text-sm font-sans text-muted-foreground">No hay contratos aún.</p>
            <p className="text-xs font-sans text-muted-foreground/60">Genera un contrato desde la pestaña de cotización de un evento.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {contracts.map((c) => {
              const cfg = STATUS_CFG[c.status]
              const ev  = c.events
              return (
                <Link key={c.id} href={ev ? `/eventos/${ev.id}?tab=contrato` : "#"}
                  className="grid grid-cols-12 gap-3 items-center px-4 py-3 table-row-hover">
                  <div className="col-span-4 min-w-0">
                    <p style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "0.9375rem", fontWeight: 500, color: "var(--text-1)", letterSpacing: "0.01em", lineHeight: 1.3 }} className="truncate">{ev?.name ?? "—"}</p>
                    <p style={{ fontFamily: "var(--font-sans), system-ui, sans-serif", fontSize: "0.7rem", color: "var(--text-2)" }} className="truncate mt-0.5">{ev?.clients?.name ?? "Sin cliente"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="mono-data" style={{ fontSize: "0.8rem", color: "var(--text-2)" }}>{ev ? formatShortDate(ev.event_date) : "—"}</p>
                  </div>
                  <div className="col-span-2 text-right">
                    <p className="mono-data" style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-1)" }}>
                      {c.quotes?.total != null ? formatCurrency(c.quotes.total) : "—"}
                    </p>
                  </div>
                  <div className="col-span-2 text-center">
                    <p className="mono-data" style={{ fontSize: "0.8rem", color: "var(--text-2)" }}>{formatShortDate(c.created_at)}</p>
                    {c.signed_at && (
                      <p className="mono-data mt-0.5" style={{ fontSize: "0.62rem", color: "#34d399" }}>Firmado {formatShortDate(c.signed_at)}</p>
                    )}
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {cfg && (
                      <span className={`status-pill ${cfg.bg} ${cfg.text}`}>
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
      </div>
    </div>
  )
}
