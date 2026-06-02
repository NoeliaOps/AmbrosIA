import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatShortDate } from "@/lib/utils"
import { UserCheck, Clock } from "lucide-react"

export const metadata: Metadata = { title: "Personal por Evento" }

const RATE_TYPE_LABEL: Record<string, string> = {
  hourly: "/hr",
  daily: "/día",
  event: "/evento",
}

export default async function PersonalEventosPage() {
  const supabase = await createClient()

  type AssignmentRow = {
    id: string
    role: string | null
    call_time: string | null
    estimated_hours: number
    computed_cost: number
    notes: string | null
    events: { id: string; name: string; event_date: string; status: string } | null
    staff_members: { id: string; name: string; position: string; rate: number; rate_type: string } | null
  }

  const { data: rawAssignments } = await supabase
    .from("event_staff_assignments")
    .select(`
      id, role, call_time, estimated_hours, computed_cost, notes,
      events(id, name, event_date, status),
      staff_members(id, name, position, rate, rate_type)
    `)
    .order("created_at", { ascending: false })

  const assignments = (rawAssignments as unknown as AssignmentRow[]) ?? []

  // Group by event
  const byEvent = new Map<string, {
    event: { id: string; name: string; event_date: string; status: string }
    items: AssignmentRow[]
    total: number
  }>()

  for (const a of assignments) {
    if (!a.events) continue
    const key = a.events.id
    if (!byEvent.has(key)) byEvent.set(key, { event: a.events, items: [], total: 0 })
    const group = byEvent.get(key)!
    group.items.push(a)
    group.total += a.computed_cost
  }

  const groups = Array.from(byEvent.values()).sort(
    (a, b) => b.event.event_date.localeCompare(a.event.event_date)
  )

  const grandTotal = assignments.reduce((s, a) => s + a.computed_cost, 0)
  const totalStaff = new Set(assignments.map((a) => a.staff_members?.id)).size

  const EVENT_STATUS_CLASS: Record<string, string> = {
    cotizado:      "bg-blue-100 text-blue-800 border-blue-200",
    contratado:    "bg-emerald-100 text-emerald-800 border-emerald-200",
    en_requisicion:"bg-amber-100 text-amber-800 border-amber-200",
    en_compras:    "bg-orange-100 text-orange-800 border-orange-200",
    completado:    "bg-sage/20 text-sage border-sage/30",
    cancelado:     "bg-red-100 text-red-800 border-red-200",
  }

  const EVENT_STATUS_LABEL: Record<string, string> = {
    cotizado: "Cotizado", contratado: "Contratado", en_requisicion: "En requisición",
    en_compras: "En compras", completado: "Completado", cancelado: "Cancelado",
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personal por Evento"
        description="Asignaciones de colaboradores organizadas por evento"
      />

      {groups.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-16 text-center space-y-3">
          <UserCheck size={32} className="mx-auto text-muted-foreground" />
          <p className="font-heading font-semibold">Sin asignaciones registradas</p>
          <p className="text-sm font-sans text-muted-foreground">
            Asigna colaboradores a los eventos desde la pestaña Personal en el detalle de cada evento.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="inline-flex items-center gap-3 rounded-lg border border-border px-4 py-3">
            <div>
              <p className="text-xs font-sans text-muted-foreground uppercase tracking-wider">Costo total personal</p>
              <p className="text-2xl font-heading font-bold tabular-nums">{formatCurrency(grandTotal)}</p>
            </div>
            <div className="h-10 w-px bg-border" />
            <div>
              <p className="text-xs font-sans text-muted-foreground uppercase tracking-wider">Eventos con personal</p>
              <p className="text-2xl font-heading font-bold">{groups.length}</p>
            </div>
            <div className="h-10 w-px bg-border" />
            <div>
              <p className="text-xs font-sans text-muted-foreground uppercase tracking-wider">Colaboradores únicos</p>
              <p className="text-2xl font-heading font-bold">{totalStaff}</p>
            </div>
          </div>

          {/* Event groups */}
          {groups.map(({ event, items, total }) => {
            const statusCfg = EVENT_STATUS_CLASS[event.status] ?? ""
            return (
              <div key={event.id} className="space-y-2">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Link href={`/eventos/${event.id}?tab=personal`} className="font-heading font-semibold hover:underline">
                      {event.name}
                    </Link>
                    <span className="text-xs font-sans text-muted-foreground">
                      {formatShortDate(event.event_date)}
                    </span>
                    <Badge variant="secondary" className={`font-sans text-xs border ${statusCfg}`}>
                      {EVENT_STATUS_LABEL[event.status] ?? event.status}
                    </Badge>
                  </div>
                  <span className="font-sans font-semibold tabular-nums">{formatCurrency(total)}</span>
                </div>

                <div className="rounded-md border border-border overflow-hidden">
                  <div className="grid grid-cols-[1fr_160px_100px_80px_100px] gap-2 px-3 py-2 bg-muted/40 text-xs font-sans font-semibold uppercase tracking-wider text-muted-foreground">
                    <span>Colaborador</span>
                    <span>Rol</span>
                    <span className="text-center">Entrada</span>
                    <span className="text-right">Tarifa</span>
                    <span className="text-right">Costo</span>
                  </div>
                  {items.map((a) => {
                    const member = a.staff_members
                    return (
                      <div key={a.id} className="grid grid-cols-[1fr_160px_100px_80px_100px] gap-2 px-3 py-2.5 border-t border-border text-sm font-sans items-center">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{member?.name ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">{member?.position ?? ""}</p>
                        </div>
                        <span className="text-muted-foreground truncate">{a.role ?? "—"}</span>
                        <span className="text-center text-muted-foreground flex items-center justify-center gap-1">
                          {a.call_time ? <><Clock size={11} />{a.call_time.slice(0, 5)}</> : "—"}
                        </span>
                        <span className="tabular-nums text-right text-muted-foreground text-xs">
                          {member ? `${formatCurrency(member.rate)}${RATE_TYPE_LABEL[member.rate_type] ?? ""}` : "—"}
                        </span>
                        <span className="tabular-nums text-right font-medium">{formatCurrency(a.computed_cost)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
