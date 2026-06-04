import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/layout/page-header"
import { formatCurrency, formatShortDate } from "@/lib/utils"
import { FileSignature, ArrowRight, Check } from "lucide-react"

export const metadata: Metadata = { title: "Contratos" }

// Identidad del módulo (Comercial → ciruela)
const ACCENT = "#6B4C6B"

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  borrador:  { label: "Borrador",  color: "#6B7280" },
  enviado:   { label: "Enviado",   color: "#3D5A80" },
  firmado:   { label: "Firmado",   color: "#2F6B4F" },
  cancelado: { label: "Cancelado", color: "#991B1B" },
}
const GROUP_ORDER = ["enviado", "borrador", "firmado", "cancelado"]
// Pasos de firma para el tracker
const SIGN_FLOW = ["borrador", "enviado", "firmado"] as const

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

  const contracts = (rawContracts ?? []) as unknown as ContractRow[]
  const firmados = contracts.filter((c) => c.status === "firmado")
  const totalFirmado = firmados.reduce((s, c) => s + (c.quotes?.total ?? 0), 0)
  const porFirmar = contracts.filter((c) => c.status === "enviado" || c.status === "borrador").length

  const grouped = GROUP_ORDER
    .map((status) => ({ status, items: contracts.filter((c) => c.status === status) }))
    .filter((g) => g.items.length > 0)

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Contratos"
        description="Contratos generados a partir de cotizaciones aprobadas."
        meta={porFirmar > 0 ? `${porFirmar} por firmar` : undefined}
      />

      {contracts.length === 0 ? (
        <div className="enterprise-card p-16 text-center space-y-2">
          <FileSignature size={28} className="mx-auto text-muted-foreground/30" />
          <p className="text-sm font-sans text-muted-foreground">No hay contratos aún.</p>
          <p className="text-xs font-sans text-muted-foreground/60">Genera un contrato desde la pestaña de cotización de un evento.</p>
        </div>
      ) : (
        <>
          {/* Resumen */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Contratos", value: String(contracts.length), sub: "en total", accent: ACCENT },
              { label: "Firmados", value: String(firmados.length), sub: formatCurrency(totalFirmado), accent: "#2F6B4F" },
              { label: "Por firmar", value: String(porFirmar), sub: "enviados + borradores", accent: "#3D5A80" },
            ].map((kpi) => (
              <div key={kpi.label} className="enterprise-card p-3.5" style={{ borderLeft: `3px solid ${kpi.accent}` }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)" }}>{kpi.label}</p>
                <p className="mono-data" style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-1)", lineHeight: 1.15, marginTop: "0.15rem" }}>{kpi.value}</p>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.68rem", color: "var(--text-3)" }}>{kpi.sub}</p>
              </div>
            ))}
          </div>

          {/* Contratos agrupados por estado */}
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
                    {items.map((c) => {
                      const ev = c.events
                      const currentStep = SIGN_FLOW.indexOf(c.status as (typeof SIGN_FLOW)[number])
                      const cancelled = c.status === "cancelado"
                      return (
                        <Link
                          key={c.id}
                          href={ev ? `/eventos/${ev.id}?tab=contrato` : "#"}
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
                                {ev?.event_date ? ` · ${formatShortDate(ev.event_date)}` : ""}
                              </p>
                            </div>
                            <span style={{
                              fontFamily: "var(--font-mono)", fontSize: "0.58rem", fontWeight: 600,
                              letterSpacing: "0.04em", color: ACCENT,
                              background: `color-mix(in srgb, ${ACCENT} 10%, white)`,
                              padding: "0.15rem 0.45rem", borderRadius: "4px", whiteSpace: "nowrap",
                            }} className="shrink-0">#{c.id.slice(-6).toUpperCase()}</span>
                          </div>

                          {/* Tracker de firma */}
                          {!cancelled ? (
                            <div className="flex items-center gap-1.5">
                              {SIGN_FLOW.map((step, i) => {
                                const reached = i <= currentStep
                                const isLast = i === SIGN_FLOW.length - 1
                                return (
                                  <div key={step} className="flex items-center gap-1.5 flex-1 last:flex-none">
                                    <span className="grid place-items-center rounded-full shrink-0" style={{
                                      height: "1.1rem", width: "1.1rem",
                                      background: reached ? cfg.color : "var(--card)",
                                      color: "#fff",
                                      boxShadow: reached ? "none" : `inset 0 0 0 1.5px var(--surface-3, #EBEBEC)`,
                                    }}>
                                      {reached && isLast ? <Check size={11} strokeWidth={3} /> : reached ? <span className="h-1 w-1 rounded-full bg-white" /> : null}
                                    </span>
                                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.04em", textTransform: "uppercase", color: reached ? cfg.color : "var(--text-3)" }}>
                                      {STATUS_CFG[step].label}
                                    </span>
                                    {!isLast && <span className="flex-1 h-px" style={{ background: i < currentStep ? cfg.color : "var(--surface-3, #EBEBEC)" }} />}
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", color: "#991B1B" }}>Contrato cancelado</p>
                          )}

                          <div className="flex items-end justify-between gap-3 mt-auto pt-2" style={{ borderTop: "1px solid var(--border-def, #EBEBEC)" }}>
                            <div>
                              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)" }}>Valor</p>
                              <p className="mono-data" style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-1)", lineHeight: 1.1 }}>
                                {c.quotes?.total != null ? formatCurrency(c.quotes.total) : "—"}
                              </p>
                              {c.signed_at && (
                                <p className="mono-data" style={{ fontSize: "0.62rem", color: "#2F6B4F" }}>firmado {formatShortDate(c.signed_at)}</p>
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
