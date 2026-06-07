import type { Metadata } from "next"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/layout/page-header"
import { formatCurrency } from "@/lib/utils"
import { DEMO_COOKIE, getPersona } from "@/lib/demo"
import { CreditCard, CheckCircle, Clock, AlertTriangle } from "lucide-react"
import { PagosClient, type PaymentRow } from "./_components/pagos-client"

export const metadata: Metadata = { title: "Pagos" }

export default async function PagosPage() {
  const supabase = await createClient()

  // Dirección/Gerencia entra directo al reporte ejecutivo; ventas a la cronología.
  const persona = getPersona((await cookies()).get(DEMO_COOKIE)?.value)
  const defaultView = persona === "ceo" || persona === "gerente" ? "reporte" : "cronologia"

  const today = new Date().toISOString().split("T")[0]

  const { data: rawPayments } = await supabase
    .from("payment_schedules")
    .select(`
      id, description, amount, due_date, status, paid_at, paid_amount, discount_amount, reference,
      events(id, name, event_date, clients(name))
    `)
    .order("due_date", { ascending: true })

  // Derive "vencido" from DB "pendiente" + past due_date so the client filter works correctly
  const payments = (rawPayments ?? []).map((p): PaymentRow => ({
    ...(p as unknown as PaymentRow),
    status: p.status === "pendiente" && p.due_date < today ? "vencido" : p.status,
  }))

  const pagados    = payments.filter((p) => p.status === "pagado")
  const pendientes = payments.filter((p) => p.status === "pendiente")
  const vencidos   = payments.filter((p) => p.status === "vencido")

  const totalCobrado  = pagados.reduce((s, p) => s + (p.paid_amount ?? p.amount), 0)
  const totalPendiente = pendientes.reduce((s, p) => s + p.amount, 0)
  const totalVencido  = vencidos.reduce((s, p) => s + p.amount, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pagos"
        description="Calendario de cobros y seguimiento de pagos por evento."
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 stagger-children">
        <div className="rounded-lg border border-border bg-card p-4 space-y-1">
          <div className="flex items-center gap-2">
            <CreditCard size={14} className="text-muted-foreground" />
            <p className="text-xs font-sans text-muted-foreground">Total hitos</p>
          </div>
          <p className="text-xl font-heading font-bold text-ink">{payments.length}</p>
          <p className="text-[10px] font-sans text-muted-foreground">En todos los eventos</p>
        </div>
        <div className="rounded-lg border p-4 space-y-1" style={{ borderColor: "rgb(82 182 138 / 0.22)", background: "rgb(82 182 138 / 0.06)" }}>
          <div className="flex items-center gap-2">
            <CheckCircle size={14} style={{ color: "var(--status-active)" }} />
            <p className="text-xs font-sans text-muted-foreground">Total cobrado</p>
          </div>
          <p className="mono-data text-xl font-bold" style={{ color: "var(--status-active)" }}>{formatCurrency(totalCobrado)}</p>
          <p className="text-[10px] font-sans text-muted-foreground">{pagados.length} pagos completados</p>
        </div>
        <div className="rounded-lg border p-4 space-y-1" style={{ borderColor: "rgb(232 162 39 / 0.2)", background: "rgb(232 162 39 / 0.05)" }}>
          <div className="flex items-center gap-2">
            <Clock size={14} style={{ color: "var(--amber)" }} />
            <p className="text-xs font-sans text-muted-foreground">Por cobrar</p>
          </div>
          <p className="mono-data text-xl font-bold" style={{ color: "var(--amber)" }}>{formatCurrency(totalPendiente)}</p>
          <p className="text-[10px] font-sans text-muted-foreground">{pendientes.length} pendientes</p>
        </div>
        <div className="rounded-lg border p-4 space-y-1" style={{ borderColor: vencidos.length > 0 ? "rgb(196 66 58 / 0.25)" : "var(--border-def)", background: vencidos.length > 0 ? "rgb(196 66 58 / 0.06)" : "var(--card)" }}>
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} style={{ color: vencidos.length > 0 ? "var(--ember)" : "var(--text-3)" }} />
            <p className="text-xs font-sans text-muted-foreground">Vencidos</p>
          </div>
          <p className="mono-data text-xl font-bold" style={{ color: vencidos.length > 0 ? "var(--ember)" : "var(--text-1)" }}>
            {formatCurrency(totalVencido)}
          </p>
          <p className="text-[10px] font-sans text-muted-foreground">{vencidos.length} pagos vencidos</p>
        </div>
      </div>

      <PagosClient payments={payments} defaultView={defaultView} />
    </div>
  )
}

