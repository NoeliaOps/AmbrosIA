import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/layout/page-header"
import { formatCurrency, formatShortDate } from "@/lib/utils"
import { UserCheck, Clock, ExternalLink } from "lucide-react"

export const metadata: Metadata = { title: "Personal por Evento" }

// Identidad del módulo (Operación → acero)
const ACCENT = "#4A5568"
const RATE_TYPE_LABEL: Record<string, string> = { hourly: "/hr", daily: "/día", event: "/evento" }
const EVENT_STATUS_CLASS: Record<string, string> = {
  cotizado: "pill-info", contratado: "pill-active", en_requisicion: "pill-warning",
  en_compras: "pill-warning", completado: "pill-done", cancelado: "pill-danger",
}
const EVENT_STATUS_LABEL: Record<string, string> = {
  cotizado: "Cotizado", contratado: "Contratado", en_requisicion: "En requisición",
  en_compras: "En compras", completado: "Completado", cancelado: "Cancelado",
}
function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personal por Evento"
        description="Asignaciones de colaboradores organizadas por evento"
      />

      {groups.length === 0 ? (
        <div className="enterprise-card p-16 text-center space-y-3">
          <UserCheck size={32} className="mx-auto text-muted-foreground/40" />
          <p className="font-heading font-semibold">Sin asignaciones registradas</p>
          <p className="text-sm font-sans text-muted-foreground">
            Asigna colaboradores a los eventos desde la pestaña Personal en el detalle de cada evento.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Resumen */}
          <div className="enterprise-card inline-flex items-center gap-5 px-5 py-3.5" style={{ borderLeft: `3px solid ${ACCENT}` }}>
            <div>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)" }}>Costo total personal</p>
              <p className="mono-data" style={{ fontSize: "1.6rem", fontWeight: 700, color: ACCENT, lineHeight: 1.1 }}>{formatCurrency(grandTotal)}</p>
            </div>
            <div className="h-10 w-px" style={{ background: "var(--border-def, #EBEBEC)" }} />
            <div>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)" }}>Eventos</p>
              <p className="mono-data" style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--text-1)", lineHeight: 1.1 }}>{groups.length}</p>
            </div>
            <div className="h-10 w-px" style={{ background: "var(--border-def, #EBEBEC)" }} />
            <div>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)" }}>Colaboradores</p>
              <p className="mono-data" style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--text-1)", lineHeight: 1.1 }}>{totalStaff}</p>
            </div>
          </div>

          {/* Roster por evento */}
          {groups.map(({ event, items, total }) => (
            <div key={event.id} className="enterprise-card overflow-hidden">
              <div className="table-header px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                  <Link href={`/eventos/${event.id}?tab=personal`} className="flex items-center gap-1.5 hover:text-gold-dark transition-colors min-w-0">
                    <span style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "0.95rem", fontWeight: 600, color: "var(--text-1)" }} className="truncate">{event.name}</span>
                    <ExternalLink size={12} className="text-muted-foreground/50 shrink-0" />
                  </Link>
                  <span className="text-xs font-sans text-muted-foreground">{formatShortDate(event.event_date)}</span>
                  <span className={`status-pill ${EVENT_STATUS_CLASS[event.status] ?? ""}`}>
                    <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "currentColor" }} />
                    {EVENT_STATUS_LABEL[event.status] ?? event.status}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)" }}>{items.length} en equipo · </span>
                  <span className="mono-data" style={{ fontSize: "0.95rem", fontWeight: 700, color: ACCENT }}>{formatCurrency(total)}</span>
                </div>
              </div>

              <div className="divide-y divide-border">
                {items.map((a) => {
                  const member = a.staff_members
                  return (
                    <div key={a.id} className="flex items-center gap-3 px-4 py-2.5">
                      <div className="shrink-0 grid place-items-center rounded-full mono-data" style={{ height: "2rem", width: "2rem", background: `color-mix(in srgb, ${ACCENT} 11%, white)`, color: ACCENT, fontSize: "0.65rem", fontWeight: 700 }}>
                        {member ? initials(member.name) : "—"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-sans truncate" style={{ fontSize: "0.88rem", fontWeight: 500, color: "var(--text-1)" }}>{member?.name ?? "—"}</p>
                        <p className="text-xs font-sans text-muted-foreground truncate">
                          {a.role ?? member?.position ?? ""}
                        </p>
                      </div>
                      {a.call_time && (
                        <span className="hidden sm:flex items-center gap-1 text-xs mono-data shrink-0" style={{ color: "var(--text-2)" }}>
                          <Clock size={12} className="text-muted-foreground" /> {a.call_time.slice(0, 5)}
                        </span>
                      )}
                      <span className="hidden md:block mono-data text-right shrink-0" style={{ fontSize: "0.72rem", color: "var(--text-3)", minWidth: "5rem" }}>
                        {member ? `${formatCurrency(member.rate)}${RATE_TYPE_LABEL[member.rate_type] ?? ""}` : "—"}
                      </span>
                      <span className="mono-data text-right shrink-0" style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-1)", minWidth: "5rem" }}>
                        {formatCurrency(a.computed_cost)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
