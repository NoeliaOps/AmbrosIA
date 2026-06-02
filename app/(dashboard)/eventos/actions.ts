"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// ── clients ──────────────────────────────────────────────────────────────────

const clientSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  phone: z.string().optional(),
  email: z.string().email("Correo inválido").optional().or(z.literal("")),
  notes: z.string().optional(),
})

export type ClientFormData = z.infer<typeof clientSchema>

async function getOrgId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", user.id).single()
  return profile?.org_id ?? null
}

export async function createClient2(data: ClientFormData) {
  const parsed = clientSchema.safeParse(data)
  if (!parsed.success) return { data: null, error: "Datos inválidos" }

  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { data: null, error: "No autenticado" }

  const { data: client, error } = await supabase
    .from("clients")
    .insert({
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      notes: parsed.data.notes || null,
      org_id: orgId,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath("/eventos")
  return { data: client, error: null }
}

export async function updateClient(id: string, data: ClientFormData) {
  const parsed = clientSchema.safeParse(data)
  if (!parsed.success) return { data: null, error: "Datos inválidos" }

  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { data: null, error: "No autenticado" }

  const { data: client, error } = await supabase
    .from("clients")
    .update({
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      notes: parsed.data.notes || null,
    })
    .eq("id", id)
    .eq("org_id", orgId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath("/eventos")
  return { data: client, error: null }
}

// ── events ───────────────────────────────────────────────────────────────────

const eventSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  client_id: z.string().optional(),
  event_type: z.string().optional(),
  event_date: z.string().min(1, "La fecha es requerida"),
  event_time: z.string().optional(),
  location: z.string().optional(),
  guest_count: z.number().int().positive("El número de invitados debe ser mayor a 0"),
  notes: z.string().optional(),
})

export type EventFormData = z.infer<typeof eventSchema>

export async function createEvent(data: EventFormData) {
  const parsed = eventSchema.safeParse(data)
  if (!parsed.success) return { data: null, error: "Datos inválidos" }

  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { data: null, error: "No autenticado" }

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      name: parsed.data.name,
      client_id: parsed.data.client_id || null,
      event_type: parsed.data.event_type || null,
      event_date: parsed.data.event_date,
      event_time: parsed.data.event_time || null,
      location: parsed.data.location || null,
      guest_count: parsed.data.guest_count,
      notes: parsed.data.notes || null,
      status: "cotizado",
      org_id: orgId,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath("/eventos")
  return { data: event, error: null }
}

export async function updateEvent(id: string, data: Partial<EventFormData> & { status?: string }) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { data: null, error: "No autenticado" }

  const { data: event, error } = await supabase
    .from("events")
    .update({
      name: data.name,
      client_id: data.client_id ?? null,
      event_type: data.event_type ?? null,
      event_date: data.event_date,
      event_time: data.event_time ?? null,
      location: data.location ?? null,
      guest_count: data.guest_count,
      notes: data.notes ?? null,
      status: data.status,
    })
    .eq("id", id)
    .eq("org_id", orgId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath("/eventos")
  revalidatePath(`/eventos/${id}`)
  return { data: event, error: null }
}

export async function updateEventStatus(id: string, status: string) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { error: "No autenticado" }

  const { error } = await supabase.from("events").update({ status }).eq("id", id).eq("org_id", orgId)
  if (error) return { error: error.message }
  revalidatePath("/eventos")
  revalidatePath(`/eventos/${id}`)
  return { error: null }
}

export async function deleteEvent(id: string) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { error: "No autenticado" }

  const { error } = await supabase.from("events").delete().eq("id", id).eq("org_id", orgId)
  if (error) return { error: error.message }
  revalidatePath("/eventos")
  return { error: null }
}
