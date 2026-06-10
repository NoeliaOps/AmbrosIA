"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const schema = z.object({
  tasting_date: z.string().min(1, "Indica la fecha de la degustación"),
  attendees: z.number().int().min(0).optional(),
  cost: z.number().min(0, "El costo debe ser positivo"),
  status: z.enum(["programada", "realizada", "cancelada"]),
  notes: z.string().optional(),
})
export type TastingFormData = z.infer<typeof schema>

async function getOrgId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", user.id).single()
  return profile?.org_id ?? null
}

export async function createTasting(eventId: string, data: TastingFormData) {
  const parsed = schema.safeParse(data)
  if (!parsed.success) return { data: null, error: "Datos inválidos" }

  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { data: null, error: "No autenticado" }

  const { data: event } = await supabase.from("events").select("id").eq("id", eventId).eq("org_id", orgId).maybeSingle()
  if (!event) return { data: null, error: "Evento no encontrado" }

  const { data: tasting, error } = await supabase
    .from("event_tastings")
    .insert({
      event_id: eventId,
      org_id: orgId,
      tasting_date: parsed.data.tasting_date,
      attendees: parsed.data.attendees ?? 0,
      cost: parsed.data.cost,
      status: parsed.data.status,
      notes: parsed.data.notes || null,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath(`/eventos/${eventId}`)
  revalidatePath("/utilidad")
  return { data: tasting, error: null }
}

export async function updateTasting(id: string, eventId: string, data: TastingFormData) {
  const parsed = schema.safeParse(data)
  if (!parsed.success) return { data: null, error: "Datos inválidos" }

  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { data: null, error: "No autenticado" }

  const { data: tasting, error } = await supabase
    .from("event_tastings")
    .update({
      tasting_date: parsed.data.tasting_date,
      attendees: parsed.data.attendees ?? 0,
      cost: parsed.data.cost,
      status: parsed.data.status,
      notes: parsed.data.notes || null,
    })
    .eq("id", id)
    .eq("org_id", orgId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath(`/eventos/${eventId}`)
  revalidatePath("/utilidad")
  return { data: tasting, error: null }
}

export async function setTastingStatus(id: string, eventId: string, status: "programada" | "realizada" | "cancelada") {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { error: "No autenticado" }

  const { error } = await supabase.from("event_tastings").update({ status }).eq("id", id).eq("org_id", orgId)
  if (error) return { error: error.message }
  revalidatePath(`/eventos/${eventId}`)
  revalidatePath("/utilidad")
  return { error: null }
}

export async function deleteTasting(id: string, eventId: string) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { error: "No autenticado" }

  const { error } = await supabase.from("event_tastings").delete().eq("id", id).eq("org_id", orgId)
  if (error) return { error: error.message }
  revalidatePath(`/eventos/${eventId}`)
  revalidatePath("/utilidad")
  return { error: null }
}
