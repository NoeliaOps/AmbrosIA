"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const schema = z.object({
  beneficiary: z.string().min(1, "Indica quién recibe la comisión"),
  role: z.string().optional(),
  basis: z.enum(["fixed", "percentage"]),
  percentage: z.number().min(0).max(100).nullable().optional(),
  amount: z.number().min(0, "El monto debe ser positivo"),
  notes: z.string().optional(),
})
export type CommissionFormData = z.infer<typeof schema>

async function getOrgId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", user.id).single()
  return profile?.org_id ?? null
}

export async function createCommission(eventId: string, data: CommissionFormData) {
  const parsed = schema.safeParse(data)
  if (!parsed.success) return { data: null, error: "Datos inválidos" }

  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { data: null, error: "No autenticado" }

  const { data: event } = await supabase.from("events").select("id").eq("id", eventId).eq("org_id", orgId).maybeSingle()
  if (!event) return { data: null, error: "Evento no encontrado" }

  const { data: commission, error } = await supabase
    .from("event_commissions")
    .insert({
      event_id: eventId,
      org_id: orgId,
      beneficiary: parsed.data.beneficiary,
      role: parsed.data.role || null,
      basis: parsed.data.basis,
      percentage: parsed.data.basis === "percentage" ? (parsed.data.percentage ?? 0) : null,
      amount: parsed.data.amount,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath(`/eventos/${eventId}`)
  revalidatePath("/utilidad")
  return { data: commission, error: null }
}

export async function updateCommission(id: string, eventId: string, data: CommissionFormData) {
  const parsed = schema.safeParse(data)
  if (!parsed.success) return { data: null, error: "Datos inválidos" }

  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { data: null, error: "No autenticado" }

  const { data: commission, error } = await supabase
    .from("event_commissions")
    .update({
      beneficiary: parsed.data.beneficiary,
      role: parsed.data.role || null,
      basis: parsed.data.basis,
      percentage: parsed.data.basis === "percentage" ? (parsed.data.percentage ?? 0) : null,
      amount: parsed.data.amount,
    })
    .eq("id", id)
    .eq("org_id", orgId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath(`/eventos/${eventId}`)
  revalidatePath("/utilidad")
  return { data: commission, error: null }
}

export async function setCommissionStatus(id: string, eventId: string, paid: boolean) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { error: "No autenticado" }

  const { error } = await supabase
    .from("event_commissions")
    .update({ status: paid ? "pagada" : "pendiente", paid_at: paid ? new Date().toISOString().slice(0, 10) : null })
    .eq("id", id)
    .eq("org_id", orgId)

  if (error) return { error: error.message }
  revalidatePath(`/eventos/${eventId}`)
  return { error: null }
}

export async function deleteCommission(id: string, eventId: string) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { error: "No autenticado" }

  const { error } = await supabase.from("event_commissions").delete().eq("id", id).eq("org_id", orgId)
  if (error) return { error: error.message }
  revalidatePath(`/eventos/${eventId}`)
  revalidatePath("/utilidad")
  return { error: null }
}
