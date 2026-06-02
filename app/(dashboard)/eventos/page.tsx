import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/layout/page-header"
import { EventList } from "./_components/event-list"

export const metadata: Metadata = { title: "Eventos" }

const PAGE_SIZE = 50

export default async function EventosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page   = Math.max(1, parseInt(pageParam ?? "1", 10))
  const offset = (page - 1) * PAGE_SIZE

  const supabase = await createClient()

  const [{ data: events, count }, { data: clients }] = await Promise.all([
    supabase
      .from("events")
      .select("id, name, event_type, event_date, location, guest_count, status, clients(name)", { count: "exact" })
      .order("event_date", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1),
    supabase
      .from("clients")
      .select("id, name, phone, email")
      .order("name"),
  ])

  const totalCount = count ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Eventos"
        description="Gestiona el ciclo de vida completo de cada evento."
        meta={`${totalCount} eventos`}
      />
      <EventList
        events={(events ?? []) as Parameters<typeof EventList>[0]["events"]}
        clients={clients ?? []}
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
      />
    </div>
  )
}
