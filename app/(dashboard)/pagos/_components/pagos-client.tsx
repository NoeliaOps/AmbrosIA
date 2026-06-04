"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { formatCurrency, formatShortDate } from "@/lib/utils"
import { CheckCircle, ExternalLink, RotateCcw } from "lucide-react"
import { markPaymentPaid, markPaymentPending } from "../actions"

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pendiente: { label: "Pendiente", className: "pill-warning" },
  pagado:    { label: "Pagado",    className: "pill-active"  },
  vencido:   { label: "Vencido",   className: "pill-danger"  },
}

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

export function PagosClient({ payments: initial }: Props) {
  const [payments, setPayments] = useState(initial)
  const [activeFilter, setActiveFilter] = useState<"todos" | "pendiente" | "pagado" | "vencido">("todos")
  const [paying, setPaying] = useState<PaymentRow | null>(null)
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split("T")[0])
  const [paidAmount, setPaidAmount] = useState("")
  const [reference, setReference] = useState("")
  const [loading, setLoading] = useState(false)

  const filtered = activeFilter === "todos" ? payments : payments.filter((p) => p.status === activeFilter)

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

  const counts = {
    pendiente: payments.filter((p) => p.status === "pendiente").length,
    pagado:    payments.filter((p) => p.status === "pagado").length,
    vencido:   payments.filter((p) => p.status === "vencido").length,
  }

  return (
    <>
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {([["todos", "Todos", payments.length], ["pendiente", "Pendientes", counts.pendiente], ["pagado", "Pagados", counts.pagado], ["vencido", "Vencidos", counts.vencido]] as const).map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => setActiveFilter(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-sans font-medium border transition-colors ${
              activeFilter === key
                ? "bg-[#2D2926] text-white border-[#2D2926]"
                : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-[#C4963B]/40"
            }`}
          >
            {label} <span className="ml-1 opacity-60">{count}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-md border border-border overflow-hidden">
        <div className="bg-muted/30 px-4 py-2.5 border-b border-border grid grid-cols-12 gap-2 text-xs font-sans font-medium text-muted-foreground uppercase tracking-wide">
          <span className="col-span-4">Evento / Concepto</span>
          <span className="col-span-2 text-right">Monto</span>
          <span className="col-span-2 text-center">Vence</span>
          <span className="col-span-2 text-center">Estado</span>
          <span className="col-span-2 text-right">Acción</span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground font-sans">Sin pagos en esta categoría.</p>
          </div>
        ) : (
          filtered.map((p, i) => {
            const cfg = STATUS_CONFIG[p.status] ?? { label: p.status, className: "" }
            const isVencido = p.status === "pendiente" && new Date(p.due_date) < new Date()
            return (
              <div
                key={p.id}
                className={`grid grid-cols-12 gap-2 items-center px-4 py-3 ${i > 0 ? "border-t border-border" : ""}`}
                style={isVencido ? { background: "rgb(196 66 58 / 0.04)" } : undefined}
              >
                <div className="col-span-4 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "0.9rem", fontWeight: 500, color: "var(--text-1)" }} className="truncate">{p.events?.name ?? "—"}</p>
                    {p.events && (
                      <Link href={`/eventos/${p.events.id}`} className="text-muted-foreground hover:text-gold-dark transition-colors shrink-0">
                        <ExternalLink size={11} />
                      </Link>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-sans truncate">
                    {p.description}
                    {p.events?.clients?.name ? ` · ${p.events.clients.name}` : ""}
                  </p>
                </div>
                <div className="col-span-2 text-right">
                  <p className="text-sm font-medium tabular-nums">{formatCurrency(p.amount)}</p>
                  {p.paid_amount != null && p.paid_amount !== p.amount && (
                    <p style={{ fontFamily: "var(--font-inter)", fontSize: "0.65rem", color: "var(--muted-foreground)" }}>
                      Cobrado: {formatCurrency(p.paid_amount)}
                    </p>
                  )}
                </div>
                <div className="col-span-2 text-center">
                  <p className="mono-data" style={{ fontSize: "0.82rem", color: isVencido ? "var(--ember)" : "var(--text-2)", fontWeight: isVencido ? 600 : 400 }}>
                    {formatShortDate(p.due_date)}
                  </p>
                  {p.paid_at && (
                    <p className="mono-data" style={{ fontSize: "0.62rem", color: "var(--status-active)" }}>{formatShortDate(p.paid_at)}</p>
                  )}
                </div>
                <div className="col-span-2 flex justify-center">
                  <span className={`status-pill ${isVencido && p.status === "pendiente" ? "pill-danger" : cfg.className}`}>
                    {isVencido && p.status === "pendiente" ? "Vencido" : cfg.label}
                  </span>
                </div>
                <div className="col-span-2 flex justify-end gap-1">
                  {p.status !== "pagado" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs font-sans gap-1"
                      onClick={() => { setPaying(p); setPaidAmount(String(p.amount)) }}
                    >
                      <CheckCircle size={12} /> Marcar pagado
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs font-sans gap-1 text-muted-foreground"
                      onClick={() => revertPay(p)}
                    >
                      <RotateCcw size={11} /> Revertir
                    </Button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Mark paid dialog */}
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
              <Input
                type="number"
                step="0.01"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-sans text-sm">Fecha de pago</Label>
              <Input
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-sans text-sm">Referencia / Transferencia</Label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="TRF-001234 o número de cheque"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaying(null)} className="font-sans">Cancelar</Button>
            <Button
              onClick={confirmPay}
              disabled={loading}
              className="bg-[#2D2926] hover:bg-[#1A1714] text-white font-sans font-medium"
            >
              {loading ? "Guardando…" : "Confirmar pago"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
