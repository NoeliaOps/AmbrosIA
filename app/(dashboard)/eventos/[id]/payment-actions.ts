"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const milestoneSchema = z.object({
  description: z.string().min(1, "La descripción es requerida"),
  amount: z.number().min(0, "El monto debe ser positivo"),
  due_date: z.string().min(1, "La fecha límite es requerida"),
  notes: z.string().optional(),
  sort_order: z.number().default(0),
})

export type MilestoneFormData = z.infer<typeof milestoneSchema>

async function getOrgId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", user.id).single()
  return profile?.org_id ?? null
}

export async function createMilestone(eventId: string, data: MilestoneFormData) {
  const parsed = milestoneSchema.safeParse(data)
  if (!parsed.success) return { data: null, error: "Datos inválidos" }

  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { data: null, error: "No autenticado" }

  // Verify the event belongs to this org before inserting
  const { data: event } = await supabase.from("events").select("id").eq("id", eventId).eq("org_id", orgId).maybeSingle()
  if (!event) return { data: null, error: "Evento no encontrado" }

  const { data: milestone, error } = await supabase
    .from("payment_schedules")
    .insert({
      event_id: eventId,
      description: parsed.data.description,
      amount: parsed.data.amount,
      due_date: parsed.data.due_date,
      notes: parsed.data.notes || null,
      sort_order: parsed.data.sort_order,
      status: "pendiente",
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath(`/eventos/${eventId}`)
  revalidatePath("/pagos")
  return { data: milestone, error: null }
}

export async function updateMilestone(id: string, eventId: string, data: Partial<MilestoneFormData>) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { data: null, error: "No autenticado" }

  const { data: milestone, error } = await supabase
    .from("payment_schedules")
    .update({
      description: data.description,
      amount: data.amount,
      due_date: data.due_date,
      notes: data.notes ?? null,
    })
    .eq("id", id)
    .eq("event_id", eventId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath(`/eventos/${eventId}`)
  revalidatePath("/pagos")
  return { data: milestone, error: null }
}

export async function markMilestonePaid(
  id: string,
  eventId: string,
  paidAt: string,
  paidAmount: number,
  reference?: string
) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { error: "No autenticado" }

  // Precondition: only transition from "pendiente" — prevents double-payment
  const { error } = await supabase
    .from("payment_schedules")
    .update({
      status: "pagado",
      paid_at: paidAt,
      paid_amount: paidAmount,
      reference: reference ?? null,
    })
    .eq("id", id)
    .eq("event_id", eventId)
    .eq("status", "pendiente")

  if (error) return { error: error.message }
  revalidatePath(`/eventos/${eventId}`)
  revalidatePath("/pagos")
  return { error: null }
}

export async function markMilestonePending(id: string, eventId: string) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { error: "No autenticado" }

  const { error } = await supabase
    .from("payment_schedules")
    .update({ status: "pendiente", paid_at: null, paid_amount: null, reference: null })
    .eq("id", id)
    .eq("event_id", eventId)
    .eq("status", "pagado")

  if (error) return { error: error.message }
  revalidatePath(`/eventos/${eventId}`)
  revalidatePath("/pagos")
  return { error: null }
}

export async function deleteMilestone(id: string, eventId: string) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { error: "No autenticado" }

  const { error } = await supabase
    .from("payment_schedules")
    .delete()
    .eq("id", id)
    .eq("event_id", eventId)

  if (error) return { error: error.message }
  revalidatePath(`/eventos/${eventId}`)
  revalidatePath("/pagos")
  return { error: null }
}
