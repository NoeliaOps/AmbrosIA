import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { CalendarView } from "./_components/calendar-view"

export const metadata: Metadata = { title: "Calendario" }

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const { month: monthParam } = await searchParams

  // Default to current month; parse as YYYY-MM
  const now     = new Date()
  const current = monthParam && /^\d{4}-\d{2}$/.test(monthParam)
    ? monthParam
    : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

  const [year, mon] = current.split("-").map(Number)
  const firstDay  = new Date(year, mon - 1, 1).toISOString().split("T")[0]
  const lastDay   = new Date(year, mon, 0).toISOString().split("T")[0]

  const supabase = await createClient()

  const { data: events } = await supabase
    .from("events")
    .select("id, name, event_date, event_time, status, guest_count, location, clients(name)")
    .gte("event_date", firstDay)
    .lte("event_date", lastDay)
    .neq("status", "cancelado")
    .order("event_date")

  return (
    <CalendarView
      events={(events ?? []) as CalendarEvent[]}
      currentMonth={current}
    />
  )
}

export type CalendarEvent = {
  id: string
  name: string
  event_date: string
  event_time: string | null
  status: string
  guest_count: number
  location: string | null
  clients: { name: string } | null
}
