"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import type { CalendarEvent } from "../page"

const STATUS_DOT: Record<string, string> = {
  cotizado:       "bg-blue-400",
  contratado:     "bg-emerald-500",
  en_requisicion: "bg-amber-400",
  en_compras:     "bg-orange-400",
  completado:     "bg-sage",
}
const STATUS_BG: Record<string, string> = {
  cotizado:       "border-blue-400/30 text-blue-400",
  contratado:     "border-emerald-400/30 text-emerald-400",
  en_requisicion: "border-amber-400/30 text-amber-400",
  en_compras:     "border-orange-400/30 text-orange-400",
  completado:     "border-sage/30 text-sage",
}

type Props = {
  events: CalendarEvent[]
  currentMonth: string   // "YYYY-MM"
}

export function CalendarView({ events, currentMonth }: Props) {
  const router = useRouter()
  const [year, mon] = currentMonth.split("-").map(Number)

  const monthLabel = new Date(year, mon - 1, 1).toLocaleDateString("es-MX", {
    month: "long", year: "numeric",
  })

  // Build grid: find first weekday of month (0=Sun…6=Sat, we use Mon as first)
  const firstDate = new Date(year, mon - 1, 1)
  const daysInMonth = new Date(year, mon, 0).getDate()
  // Monday-first offset: Mon=0, Tue=1, … Sun=6
  const startOffset = (firstDate.getDay() + 6) % 7

  // Prev / next month
  const prevDate  = new Date(year, mon - 2, 1)
  const nextDate  = new Date(year, mon, 1)
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`
  const nextMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`

  // Map events by day-of-month
  const byDay = new Map<number, CalendarEvent[]>()
  for (const ev of events) {
    const d = parseInt(ev.event_date.split("-")[2], 10)
    if (!byDay.has(d)) byDay.set(d, [])
    byDay.get(d)!.push(ev)
  }

  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === mon
  const todayDay = today.getDate()

  const DAYS_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

  // Total cells needed (round up to full weeks)
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7
  const cells = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - startOffset + 1
    return dayNum >= 1 && dayNum <= daysInMonth ? dayNum : null
  })

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "1.75rem", fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.02em" }}>
            Calendario
          </h1>
          <p className="text-sm font-sans text-muted-foreground mt-0.5">Vista mensual de eventos programados</p>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href={`/calendario?month=${prevMonth}`}
            className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border bg-card hover:bg-muted hover:border-gold/40 transition-colors"
          >
            <ChevronLeft size={15} />
          </Link>
          <button
            onClick={() => {
              const now = new Date()
              router.push(`/calendario?month=${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`)
            }}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border bg-card hover:bg-muted hover:border-gold/40 transition-colors text-xs font-sans text-muted-foreground"
          >
            <Calendar size={12} />
            Hoy
          </button>
          <Link
            href={`/calendario?month=${nextMonth}`}
            className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border bg-card hover:bg-muted hover:border-gold/40 transition-colors"
          >
            <ChevronRight size={15} />
          </Link>
        </div>
      </div>

      {/* Month label */}
      <div className="section-header">
        <p style={{
          fontFamily: "var(--font-display), Georgia, serif",
          fontSize: "1.25rem",
          fontWeight: 600,
          color: "var(--text-1)",
          letterSpacing: "0.01em",
          textTransform: "capitalize",
        }}>
          {monthLabel}
        </p>
        <p className="text-xs font-sans text-muted-foreground">
          {events.length === 0
            ? "Sin eventos este mes"
            : `${events.length} evento${events.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Calendar grid */}
      <div className="enterprise-card overflow-hidden">
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {DAYS_ES.map((d) => (
            <div key={d} className="py-2 text-center text-[11px] font-sans font-semibold uppercase tracking-wider text-muted-foreground border-r border-border last:border-r-0">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const isToday  = isCurrentMonth && day === todayDay
            const dayEvents = day ? (byDay.get(day) ?? []) : []
            const isWeekend = i % 7 >= 5

            return (
              <div
                key={i}
                className={`min-h-[100px] p-2 border-r border-b border-border last:border-r-0 ${
                  !day ? "bg-muted/20" : isWeekend ? "bg-muted/10" : ""
                }`}
              >
                {day && (
                  <>
                    {/* Day number */}
                    <div className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-sans mb-1.5 ${
                      isToday
                        ? "bg-gold text-ink font-semibold"
                        : "text-muted-foreground"
                    }`}>
                      {day}
                    </div>

                    {/* Events */}
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map((ev) => (
                        <Link
                          key={ev.id}
                          href={`/eventos/${ev.id}`}
                          className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-sans border truncate hover:opacity-80 transition-opacity ${STATUS_BG[ev.status] ?? "border-border text-muted-foreground"}`}
                          style={{ background: "var(--surface-2)" }}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${STATUS_DOT[ev.status] ?? "bg-gray-400"}`} />
                          <span className="truncate">{ev.name}</span>
                        </Link>
                      ))}
                      {dayEvents.length > 3 && (
                        <p className="text-[10px] font-sans text-muted-foreground px-1">
                          +{dayEvents.length - 3} más
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        <p className="text-[11px] font-sans font-semibold uppercase tracking-wider text-muted-foreground">Estado:</p>
        {[
          ["cotizado",       "Cotizado"],
          ["contratado",     "Contratado"],
          ["en_requisicion", "En requisición"],
          ["en_compras",     "En compras"],
          ["completado",     "Completado"],
        ].map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${STATUS_DOT[key]}`} />
            <span className="text-[11px] font-sans text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
