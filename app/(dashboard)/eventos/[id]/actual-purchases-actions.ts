"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

async function getOrgId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", user.id).single()
  return profile?.org_id ?? null
}

export async function createActualPurchase(eventId: string, data: {
  ingredient_id: string
  quantity: number
  unit: string
  unit_cost: number
  purchased_at: string
  notes?: string
}) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { data: null, error: "No autenticado" }

  const { data: purchase, error } = await supabase
    .from("actual_purchases")
    .insert({
      org_id: orgId,
      event_id: eventId,
      ingredient_id: data.ingredient_id,
      quantity: data.quantity,
      unit: data.unit,
      unit_cost: data.unit_cost,
      total_cost: Math.round(data.quantity * data.unit_cost * 100) / 100,
      purchased_at: data.purchased_at,
      notes: data.notes || null,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath(`/eventos/${eventId}`)
  revalidatePath("/compras-reales")
  return { data: purchase, error: null }
}

export async function updateActualPurchase(id: string, eventId: string, data: {
  quantity: number
  unit_cost: number
  purchased_at: string
  notes?: string
}) {
  const supabase = await createClient()
  const { data: purchase, error } = await supabase
    .from("actual_purchases")
    .update({
      quantity: data.quantity,
      unit_cost: data.unit_cost,
      total_cost: Math.round(data.quantity * data.unit_cost * 100) / 100,
      purchased_at: data.purchased_at,
      notes: data.notes || null,
    })
    .eq("id", id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath(`/eventos/${eventId}`)
  revalidatePath("/compras-reales")
  return { data: purchase, error: null }
}

export async function deleteActualPurchase(id: string, eventId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("actual_purchases").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidatePath(`/eventos/${eventId}`)
  revalidatePath("/compras-reales")
  return { error: null }
}

export async function upsertEventIndirectCost(eventId: string, data: {
  id?: string
  category_id: string
  amount: number
  notes?: string
}) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { data: null, error: "No autenticado" }

  if (data.id) {
    const { data: updated, error } = await supabase
      .from("event_indirect_costs")
      .update({ amount: data.amount, notes: data.notes ?? null })
      .eq("id", data.id)
      .select()
      .single()
    if (error) return { data: null, error: error.message }
    revalidatePath(`/eventos/${eventId}`)
    revalidatePath("/utilidad")
    return { data: updated, error: null }
  }

  const { data: created, error } = await supabase
    .from("event_indirect_costs")
    .insert({
      org_id: orgId,
      event_id: eventId,
      category_id: data.category_id,
      amount: data.amount,
      notes: data.notes ?? null,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath(`/eventos/${eventId}`)
  revalidatePath("/utilidad")
  return { data: created, error: null }
}

export async function deleteEventIndirectCost(id: string, eventId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("event_indirect_costs").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidatePath(`/eventos/${eventId}`)
  revalidatePath("/utilidad")
  return { error: null }
}
