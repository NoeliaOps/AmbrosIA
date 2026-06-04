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
  reference: string | null
  events: {
    id: string
    name: string
    event_date: string
    clients: { name: string } | null
  } | null
}

type Props = { payments: PaymentRow[] }

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

export function PagosClient({ payments: initial }: Props) {
  const [payments, setPayments] = useState(initial)
  const [activeFilter, setActiveFilter] = useState<FilterKey>("todos")
  const [paying, setPaying] = useState<PaymentRow | null>(null)
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split("T")[0])
  const [paidAmount, setPaidAmount] = useState("")
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
    const amount = parseFloat(paidAmount) || paying.amount
    const { error } = await markPaymentPaid(paying.id, paying.events?.id ?? "", paidAt, amount, reference || undefined)
    if (error) { toast.error(error); setLoading(false); return }
    setPayments((prev) => prev.map((p) =>
      p.id === paying.id ? { ...p, status: "pagado", paid_at: paidAt, paid_amount: amount, reference: reference || null } : p
    ))
    toast.success("Pago registrado")
    setPaying(null)
    setLoading(false)
    setPaidAmount("")
    setReference("")
  }

  async function revertPay(payment: PaymentRow) {
    const { error } = await markPaymentPending(payment.id, payment.events?.id ?? "")
    if (error) { toast.error(error); return }
    setPayments((prev) => prev.map((p) =>
      p.id === payment.id ? { ...p, status: "pendiente", paid_at: null, paid_amount: null, reference: null } : p
    ))
    toast.success("Pago revertido a pendiente")
  }

  return (
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
                            </div>

                            {/* Acción */}
                            <div className="shrink-0">
                              {p.status !== "pagado" ? (
                                <Button
                                  size="sm" variant="outline"
                                  className="h-7 text-xs font-sans gap-1"
                                  onClick={() => { setPaying(p); setPaidAmount(String(p.amount)) }}
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

      {/* Diálogo registrar pago */}
      <Dialog open={!!paying} onOpenChange={(o) => !o && setPaying(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Registrar pago</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <p className="text-sm font-sans text-muted-foreground">{paying?.description}</p>
              <p className="text-xs font-sans text-muted-foreground/70">{paying?.events?.name}</p>
            </div>
            <div className="space-y-1.5">
              <Label className="font-sans text-sm">Monto cobrado (MXN)</Label>
              <Input type="number" step="0.01" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-sans text-sm">Fecha de pago</Label>
              <Input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
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
