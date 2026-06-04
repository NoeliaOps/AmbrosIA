import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/layout/page-header"
import { PostmortemClient, type EventWithPostmortem } from "./_components/postmortem-client"

export const metadata: Metadata = { title: "Post-mortem" }

export default async function PostmortemPage() {
  const supabase = await createClient()

  // Eventos completados (los candidatos a retrospectiva) + su post-mortem si existe
  const { data } = await supabase
    .from("events")
    .select("id, name, event_date, guest_count, clients(name), event_postmortems(id, rating, went_well, to_improve, lessons, updated_at)")
    .eq("status", "completado")
    .order("event_date", { ascending: false })

  const events = (data ?? []) as unknown as EventWithPostmortem[]

  return (
    <div className="space-y-6">
      <PageHeader title="Post-mortem" description="Retrospectiva y lecciones aprendidas de los eventos completados." />
      <PostmortemClient events={events} />
    </div>
  )
}
