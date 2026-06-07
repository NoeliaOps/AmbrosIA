"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { formatCurrency, formatShortDate } from "@/lib/utils"
import { CheckCircle2, Circle, AlertTriangle, ExternalLink, RotateCcw } from "lucide-react"
import { markPaymentPaid, markPaymentPending } from "../actions"

// Identidad del módulo Pagos (Finanzas → verde bosque)
const ACCENT = "#2F6B4F"
const GREEN = "#166534"
const EMBER = "#991B1B"

export type PaymentRow = {
  id: string
  description: string
  amount: number
  due_date: string
  status: string
  paid_at: string | null
  paid_amount: number | null
  discount_amount: number
  reference: string | null
  events: {
    id: string
    name: string
    event_date: string
    clients: { name: string } | null
  } | null
}

type Props = { payments: PaymentRow[]; defaultView?: "cronologia" | "reporte" }

const FILTERS = [
  ["todos", "Todos"],
  ["pendiente", "Pendientes"],
  ["pagado", "Pagados"],
  ["vencido", "Vencidos"],
] as const
type FilterKey = (typeof FILTERS)[number][0]

function monthLabel(key: string) {
  // key = YYYY-MM
  const [y, m] = key.split("-").map(Number)
  const label = new Date(y, m - 1, 1).toLocaleDateString("es-MX", { month: "long", year: "numeric" })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function PagosClient({ payments: initial, defaultView = "cronologia" }: Props) {
  const [payments, setPayments] = useState(initial)
  const [view, setView] = useState<"cronologia" | "reporte">(defaultView)
  const [activeFilter, setActiveFilter] = useState<FilterKey>("todos")
  const [paying, setPaying] = useState<PaymentRow | null>(null)
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split("T")[0])
  const [paidAmount, setPaidAmount] = useState("")
  const [discount, setDiscount] = useState("0")
  const [reference, setReference] = useState("")
  const [loading, setLoading] = useState(false)

  const thisMonth = new Date().toISOString().slice(0, 7)

  const filtered = activeFilter === "todos" ? payments : payments.filter((p) => p.status === activeFilter)

  // Agrupar por mes de vencimiento → cronología de flujo
  const groups = useMemo(() => {
    const map = new Map<string, PaymentRow[]>()
    for (const p of filtered) {
      const key = p.due_date.slice(0, 7)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(p)
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, items]) => {
        items.sort((a, b) => a.due_date.localeCompare(b.due_date))
        const porCobrar = items.filter((i) => i.status !== "pagado").reduce((s, i) => s + i.amount, 0)
        const cobrado = items.filter((i) => i.status === "pagado").reduce((s, i) => s + (i.paid_amount ?? i.amount), 0)
        return { key, items, porCobrar, cobrado }
      })
  }, [filtered])

  const counts = {
    todos: payments.length,
    pendiente: payments.filter((p) => p.status === "pendiente").length,
    pagado: payments.filter((p) => p.status === "pagado").length,
    vencido: payments.filter((p) => p.status === "vencido").length,
  }

  async function confirmPay() {
    if (!paying) return
    setLoading(true)
    const disc = parseFloat(discount) || 0
    const amount = parseFloat(paidAmount) || Math.max(0, paying.amount - disc)
    const { error } = await markPaymentPaid(paying.id, paying.events?.id ?? "", paidAt, amount, reference || undefined, disc)
    if (error) { toast.error(error); setLoading(false); return }
    setPayments((prev) => prev.map((p) =>
      p.id === paying.id ? { ...p, status: "pagado", paid_at: paidAt, paid_amount: amount, discount_amount: disc, reference: reference || null } : p
    ))
    toast.success("Pago registrado")
    setPaying(null)
    setLoading(false)
    setPaidAmount("")
    setReference("")
    setDiscount("0")
  }

  async function revertPay(payment: PaymentRow) {
    const { error } = await markPaymentPending(payment.id, payment.events?.id ?? "")
    if (error) { toast.error(error); return }
    setPayments((prev) => prev.map((p) =>
      p.id === payment.id ? { ...p, status: "pendiente", paid_at: null, paid_amount: null, discount_amount: 0, reference: null } : p
    ))
    toast.success("Pago revertido a pendiente")
  }

  return (
    <>
      {/* Selector de vista */}
      <div className="flex items-center gap-1 p-1 rounded-lg w-fit" style={{ background: "var(--surface-2, #F4F4F5)" }}>
        {([["cronologia", "Cronología"], ["reporte", "Reporte ejecutivo"]] as const).map(([k, label]) => (
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

      {view === "reporte" ? (
        <PaymentsReport payments={payments} />
      ) : (
      <>
      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(([key, label]) => {
          const active = activeFilter === key
          return (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className="px-3 py-1.5 rounded-full text-xs font-sans font-medium border transition-colors"
              style={active
                ? { background: ACCENT, color: "#fff", borderColor: ACCENT }
                : { background: "var(--card)", color: "var(--text-2)", borderColor: "var(--border-def, #EBEBEC)" }}
            >
              {label} <span className="ml-1 opacity-60">{counts[key]}</span>
            </button>
          )
        })}
      </div>

      {/* Cronología de flujo de caja */}
      {groups.length === 0 ? (
        <div className="enterprise-card py-14 text-center space-y-2">
          <CreditCardGlyph />
          <p className="text-sm text-muted-foreground font-sans">Sin pagos en esta categoría.</p>
        </div>
      ) : (
        <div className="space-y-7">
          {groups.map(({ key, items, porCobrar, cobrado }) => {
            const isCurrent = key === thisMonth
            return (
              <section key={key}>
                {/* Cabecera de mes */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <h3 style={{
                      fontFamily: "var(--font-display), Georgia, serif",
                      fontSize: "1.05rem", fontWeight: 600, color: "var(--text-1)",
                      letterSpacing: "-0.01em",
                    }}>{monthLabel(key)}</h3>
                    {isCurrent && (
                      <span style={{
                        fontFamily: "var(--font-mono)", fontSize: "0.55rem", fontWeight: 600,
                        letterSpacing: "0.12em", textTransform: "uppercase",
                        color: ACCENT, background: `color-mix(in srgb, ${ACCENT} 12%, white)`,
                        padding: "0.1rem 0.4rem", borderRadius: "9999px",
                      }}>Mes actual</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    {porCobrar > 0 && (
                      <div>
                        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)" }}>Por cobrar</p>
                        <p className="mono-data" style={{ fontSize: "0.85rem", fontWeight: 600, color: ACCENT }}>{formatCurrency(porCobrar)}</p>
                      </div>
                    )}
                    {cobrado > 0 && (
                      <div>
                        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)" }}>Cobrado</p>
                        <p className="mono-data" style={{ fontSize: "0.85rem", fontWeight: 600, color: GREEN }}>{formatCurrency(cobrado)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rail + nodos */}
                <div className="relative pl-6" style={{ borderLeft: `1.5px solid var(--border-def, #EBEBEC)`, marginLeft: "0.5rem" }}>
                  <div className="space-y-2.5">
                    {items.map((p) => {
                      const isVencido = p.status === "vencido" || (p.status === "pendiente" && new Date(p.due_date) < new Date())
                      const dotColor = p.status === "pagado" ? GREEN : isVencido ? EMBER : ACCENT
                      const Dot = p.status === "pagado" ? CheckCircle2 : isVencido ? AlertTriangle : Circle
                      return (
                        <div key={p.id} className="relative">
                          {/* Nodo sobre el rail */}
                          <div
                            className="absolute grid place-items-center rounded-full"
                            style={{
                              left: "-2.0rem", top: "0.85rem",
                              height: "1.15rem", width: "1.15rem",
                              background: "var(--card, #fff)", color: dotColor,
                            }}
                          >
                            <Dot size={15} strokeWidth={2} fill={p.status === "pagado" ? "none" : "none"} />
                          </div>

                          {/* Tarjeta del hito */}
                          <div
                            className="rounded-lg border bg-card px-4 py-3 flex items-center gap-3 transition-colors"
                            style={{
                              borderColor: isVencido ? "color-mix(in srgb, #991B1B 30%, white)" : "var(--border-def, #EBEBEC)",
                              background: isVencido ? "color-mix(in srgb, #991B1B 4%, white)" : "var(--card)",
                            }}
                          >
                            {/* Fecha */}
                            <div className="shrink-0 text-center" style={{ width: "2.75rem" }}>
                              <p className="mono-data" style={{ fontSize: "1.05rem", fontWeight: 700, color: isVencido ? EMBER : "var(--text-1)", lineHeight: 1 }}>
                                {new Date(p.due_date).getUTCDate()}
                              </p>
                              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)" }}>
                                {new Date(p.due_date).toLocaleDateString("es-MX", { month: "short", timeZone: "UTC" }).replace(".", "")}
                              </p>
                            </div>

                            {/* Concepto */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <p style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "0.95rem", fontWeight: 500, color: "var(--text-1)" }} className="truncate">
                                  {p.description}
                                </p>
                                {isVencido && (
                                  <span className="status-pill pill-danger shrink-0">Vencido</span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground font-sans truncate flex items-center gap-1">
                                {p.events?.name ?? "—"}
                                {p.events?.clients?.name ? ` · ${p.events.clients.name}` : ""}
                                {p.events && (
                                  <Link href={`/eventos/${p.events.id}`} className="text-muted-foreground hover:text-gold-dark transition-colors shrink-0">
                                    <ExternalLink size={11} />
                                  </Link>
                                )}
                              </p>
                            </div>

                            {/* Monto */}
                            <div className="shrink-0 text-right">
                              <p className="mono-data" style={{ fontSize: "0.95rem", fontWeight: 700, color: p.status === "pagado" ? GREEN : "var(--text-1)" }}>
                                {formatCurrency(p.amount)}
                              </p>
                              {p.status === "pagado" && p.paid_at && (
                                <p className="mono-data" style={{ fontSize: "0.6rem", color: GREEN }}>cobrado {formatShortDate(p.paid_at)}</p>
                              )}
                              {p.discount_amount > 0 && (
                                <p className="mono-data" style={{ fontSize: "0.58rem", color: GOLD }}>−{formatCurrency(p.discount_amount)} pronto pago</p>
                              )}
                            </div>

                            {/* Acción */}
                            <div className="shrink-0">
                              {p.status !== "pagado" ? (
                                <Button
                                  size="sm" variant="outline"
                                  className="h-7 text-xs font-sans gap-1"
                                  onClick={() => { setPaying(p); setPaidAmount(String(p.amount)); setDiscount("0") }}
                                >
                                  <CheckCircle2 size={12} /> Pagar
                                </Button>
                              ) : (
                                <Button
                                  size="sm" variant="ghost"
                                  className="h-7 text-xs font-sans gap-1 text-muted-foreground"
                                  onClick={() => revertPay(p)}
                                >
                                  <RotateCcw size={11} /> Revertir
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </section>
            )
          })}
        </div>
      )}

      </>
      )}

      {/* Diálogo registrar pago */}
      <Dialog open={!!paying} onOpenChange={(o) => !o && setPaying(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Registrar pago</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <p className="text-sm font-sans text-muted-foreground">{paying?.description}</p>
              <p className="text-xs font-sans text-muted-foreground/70">
                {paying?.events?.name}{paying ? ` · monto del hito ${formatCurrency(paying.amount)}` : ""}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-sans text-sm">Fecha de pago</Label>
                <Input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="font-sans text-sm">Descuento pronto pago</Label>
                <Input
                  type="number" step="0.01" min="0" value={discount}
                  onChange={(e) => {
                    const d = parseFloat(e.target.value) || 0
                    setDiscount(e.target.value)
                    setPaidAmount(String(Math.max(0, (paying?.amount ?? 0) - d)))
                  }}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="font-sans text-sm">Monto cobrado (MXN)</Label>
              <Input type="number" step="0.01" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} placeholder="0.00" />
              <p className="text-[11px] font-sans text-muted-foreground">Monto − descuento; ajustable para pago parcial.</p>
            </div>
            <div className="space-y-1.5">
              <Label className="font-sans text-sm">Referencia / Transferencia</Label>
              <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="TRF-001234 o número de cheque" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaying(null)} className="font-sans">Cancelar</Button>
            <Button onClick={confirmPay} disabled={loading} className="bg-[#2D2926] hover:bg-[#1A1714] text-white font-sans font-medium">
              {loading ? "Guardando…" : "Confirmar pago"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function CreditCardGlyph() {
  return (
    <div className="mx-auto grid place-items-center rounded-xl" style={{ height: "2.5rem", width: "2.5rem", background: `color-mix(in srgb, ${ACCENT} 10%, white)`, color: ACCENT }}>
      <CheckCircle2 size={18} />
    </div>
  )
}

// ── Reporte ejecutivo (reemplaza el Excel semanal + resumen mensual) ──
const GOLD = "#8B6D24"

function weekStartKey(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00")
  const dow = (d.getDay() + 6) % 7 // lunes = 0
  d.setDate(d.getDate() - dow)
  return d.toISOString().slice(0, 10)
}
function weekLabel(startKey: string) {
  const s = new Date(startKey + "T12:00:00")
  const e = new Date(s); e.setDate(e.getDate() + 6)
  const f = (d: Date) => d.toLocaleDateString("es-MX", { day: "numeric", month: "short" }).replace(".", "")
  return `${f(s)} – ${f(e)}`
}

function PaymentsReport({ payments }: { payments: PaymentRow[] }) {
  // Resumen por mes (por fecha de vencimiento)
  const mMap = new Map<string, { prog: number; cob: number; pc: number; venc: number }>()
  for (const p of payments) {
    const k = p.due_date.slice(0, 7)
    const e = mMap.get(k) ?? { prog: 0, cob: 0, pc: 0, venc: 0 }
    e.prog += p.amount
    if (p.status === "pagado") e.cob += p.paid_amount ?? p.amount
    else if (p.status === "vencido") e.venc += p.amount
    else e.pc += p.amount
    mMap.set(k, e)
  }
  const months = [...mMap.entries()].sort(([a], [b]) => a.localeCompare(b))
  const tot = months.reduce((t, [, m]) => ({ prog: t.prog + m.prog, cob: t.cob + m.cob, pc: t.pc + m.pc, venc: t.venc + m.venc }), { prog: 0, cob: 0, pc: 0, venc: 0 })

  // Cobranza por semana (cobros registrados, por fecha de pago)
  const wMap = new Map<string, { cob: number; count: number }>()
  for (const p of payments) {
    if (p.status === "pagado" && p.paid_at) {
      const k = weekStartKey(p.paid_at)
      const e = wMap.get(k) ?? { cob: 0, count: 0 }
      e.cob += p.paid_amount ?? p.amount; e.count++
      wMap.set(k, e)
    }
  }
  const weeks = [...wMap.entries()].sort(([a], [b]) => b.localeCompare(a)).slice(0, 10)
  const thisWeek = weekStartKey(new Date().toISOString().slice(0, 10))
  const maxWeek = Math.max(1, ...weeks.map(([, w]) => w.cob))

  if (payments.length === 0) {
    return <div className="enterprise-card py-14 text-center"><p className="text-sm font-sans text-muted-foreground">Aún no hay pagos registrados.</p></div>
  }

  return (
    <div className="space-y-6">
      {/* Resumen por mes */}
      <section className="enterprise-card overflow-hidden">
        <div className="table-header px-4 py-2.5 flex items-center justify-between">
          <span className="text-[11px] font-sans font-semibold uppercase tracking-wider text-muted-foreground">Resumen por mes</span>
          <span className="text-[11px] font-sans text-muted-foreground">% = cobrado sobre programado</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)" }} className="border-b border-border">
                <th className="px-4 py-2 text-left">Mes</th>
                <th className="px-3 py-2 text-right">Programado</th>
                <th className="px-3 py-2 text-right">Cobrado</th>
                <th className="px-3 py-2 text-right">Por cobrar</th>
                <th className="px-3 py-2 text-right">Vencido</th>
                <th className="px-3 py-2 text-right" style={{ width: "130px" }}>% cobrado</th>
              </tr>
            </thead>
            <tbody>
              {months.map(([k, m]) => {
                const pct = m.prog > 0 ? (m.cob / m.prog) * 100 : 0
                return (
                  <tr key={k} className="border-t border-border table-row-hover">
                    <td className="px-4 py-2.5 font-sans" style={{ color: "var(--text-1)" }}>{monthLabel(k)}</td>
                    <td className="px-3 py-2.5 text-right mono-data" style={{ color: "var(--text-1)" }}>{formatCurrency(m.prog)}</td>
                    <td className="px-3 py-2.5 text-right mono-data" style={{ color: GREEN, fontWeight: 600 }}>{formatCurrency(m.cob)}</td>
                    <td className="px-3 py-2.5 text-right mono-data" style={{ color: m.pc > 0 ? GOLD : "var(--text-3)" }}>{m.pc > 0 ? formatCurrency(m.pc) : "—"}</td>
                    <td className="px-3 py-2.5 text-right mono-data" style={{ color: m.venc > 0 ? EMBER : "var(--text-3)" }}>{m.venc > 0 ? formatCurrency(m.venc) : "—"}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2 justify-end">
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ width: "48px", background: "var(--surface-3, #EBEBEC)" }}>
                          <div className="h-full" style={{ width: `${Math.min(100, pct)}%`, background: GREEN }} />
                        </div>
                        <span className="mono-data" style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-2)", width: "2.6rem", textAlign: "right" }}>{pct.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2" style={{ borderColor: "var(--text-1)" }}>
                <td className="px-4 py-2.5 font-sans font-semibold" style={{ color: "var(--text-1)" }}>Total</td>
                <td className="px-3 py-2.5 text-right mono-data font-bold">{formatCurrency(tot.prog)}</td>
                <td className="px-3 py-2.5 text-right mono-data font-bold" style={{ color: GREEN }}>{formatCurrency(tot.cob)}</td>
                <td className="px-3 py-2.5 text-right mono-data font-bold" style={{ color: GOLD }}>{formatCurrency(tot.pc)}</td>
                <td className="px-3 py-2.5 text-right mono-data font-bold" style={{ color: EMBER }}>{formatCurrency(tot.venc)}</td>
                <td className="px-3 py-2.5 text-right mono-data font-bold" style={{ color: "var(--text-2)" }}>{tot.prog > 0 ? ((tot.cob / tot.prog) * 100).toFixed(0) : 0}%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* Cobranza por semana */}
      <section className="enterprise-card overflow-hidden">
        <div className="table-header px-4 py-2.5 flex items-center justify-between">
          <span className="text-[11px] font-sans font-semibold uppercase tracking-wider text-muted-foreground">Cobranza por semana</span>
          <span className="text-[11px] font-sans text-muted-foreground">{weeks.length > 0 ? `últimas ${weeks.length} semanas` : ""}</span>
        </div>
        {weeks.length === 0 ? (
          <div className="py-10 text-center"><p className="text-sm font-sans text-muted-foreground">Aún no hay cobros registrados.</p></div>
        ) : (
          <div className="divide-y divide-border">
            {weeks.map(([k, w]) => {
              const isThis = k === thisWeek
              return (
                <div key={k} className="flex items-center gap-3 px-4 py-2.5" style={isThis ? { background: `color-mix(in srgb, ${ACCENT} 5%, white)` } : undefined}>
                  <div className="shrink-0" style={{ width: "9.5rem" }}>
                    <span className="font-sans text-sm" style={{ color: "var(--text-1)", fontWeight: isThis ? 600 : 400 }}>{weekLabel(k)}</span>
                    {isThis && <span className="ml-1.5" style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.1em", textTransform: "uppercase", color: ACCENT }}>esta sem.</span>}
                  </div>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-3, #EBEBEC)" }}>
                    <div className="h-full" style={{ width: `${(w.cob / maxWeek) * 100}%`, background: ACCENT }} />
                  </div>
                  <span className="shrink-0 mono-data text-right" style={{ fontSize: "0.7rem", color: "var(--text-3)", width: "3.5rem" }}>{w.count} pago{w.count !== 1 ? "s" : ""}</span>
                  <span className="shrink-0 mono-data text-right" style={{ fontSize: "0.9rem", fontWeight: 700, color: GREEN, width: "6.5rem" }}>{formatCurrency(w.cob)}</span>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
