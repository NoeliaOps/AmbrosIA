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
  reference?: string,
  discountAmount = 0
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
      discount_amount: discountAmount,
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

// Genera el plan de pagos por defecto: 30% de anticipo (hoy) + 70% de
// liquidación dos semanas antes del evento. Regla general; luego es editable.
export async function generateDefaultPlan(eventId: string) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { data: null, error: "No autenticado" }

  const { data: event } = await supabase
    .from("events")
    .select("id, event_date, quotes(total, status, version_number)")
    .eq("id", eventId)
    .eq("org_id", orgId)
    .maybeSingle()
  if (!event) return { data: null, error: "Evento no encontrado" }

  const { count } = await supabase
    .from("payment_schedules")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
  if ((count ?? 0) > 0) {
    return { data: null, error: "El evento ya tiene hitos de pago. Elimínalos para regenerar el plan." }
  }

  const quotes = (event.quotes ?? []) as { total: number; status: string; version_number: number }[]
  const sorted = [...quotes].sort((a, b) => b.version_number - a.version_number)
  const total = sorted.find((q) => q.status === "aprobada")?.total ?? sorted[0]?.total ?? 0
  if (total <= 0) return { data: null, error: "No hay cotización con total para generar el plan." }

  const round2 = (n: number) => Math.round(n * 100) / 100
  const anticipo = round2(total * 0.3)
  const liquidacion = round2(total - anticipo)

  const today = new Date().toISOString().slice(0, 10)
  const liq = new Date(event.event_date + "T12:00:00")
  liq.setDate(liq.getDate() - 14) // dos semanas antes
  const liqDate = liq.toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from("payment_schedules")
    .insert([
      { event_id: eventId, description: "Anticipo (30%)", amount: anticipo, due_date: today, sort_order: 0, status: "pendiente" },
      { event_id: eventId, description: "Liquidación (70%)", amount: liquidacion, due_date: liqDate, sort_order: 1, status: "pendiente" },
    ])
    .select()

  if (error) return { data: null, error: error.message }
  revalidatePath(`/eventos/${eventId}`)
  revalidatePath("/pagos")
  return { data, error: null }
}

export async function markMilestonePending(id: string, eventId: string) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { error: "No autenticado" }

  const { error } = await supabase
    .from("payment_schedules")
    .update({ status: "pendiente", paid_at: null, paid_amount: null, discount_amount: 0, reference: null })
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
