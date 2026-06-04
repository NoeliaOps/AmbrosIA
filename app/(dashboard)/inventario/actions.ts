"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const schema = z.object({
  ingredient_id: z.string().uuid("Selecciona un insumo"),
  quantity: z.number().min(0, "La cantidad debe ser positiva"),
  min_quantity: z.number().min(0, "El mínimo debe ser positivo"),
  notes: z.string().optional(),
})
export type InventoryFormData = z.infer<typeof schema>

async function getOrgId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", user.id).single()
  return profile?.org_id ?? null
}

export async function createInventoryItem(data: InventoryFormData) {
  const parsed = schema.safeParse(data)
  if (!parsed.success) return { data: null, error: "Datos inválidos" }

  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { data: null, error: "No autenticado" }

  const { data: item, error } = await supabase
    .from("inventory_items")
    .insert({ ...parsed.data, org_id: orgId })
    .select()
    .single()

  if (error) {
    if (error.code === "23505") return { data: null, error: "Ese insumo ya está en el inventario" }
    return { data: null, error: error.message }
  }
  revalidatePath("/inventario")
  return { data: item, error: null }
}

export async function updateInventoryItem(id: string, data: { quantity: number; min_quantity: number; notes?: string }) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { data: null, error: "No autenticado" }

  const { data: item, error } = await supabase
    .from("inventory_items")
    .update({ quantity: data.quantity, min_quantity: data.min_quantity, notes: data.notes })
    .eq("id", id)
    .eq("org_id", orgId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath("/inventario")
  return { data: item, error: null }
}

export async function deleteInventoryItem(id: string) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { error: "No autenticado" }

  const { error } = await supabase.from("inventory_items").delete().eq("id", id).eq("org_id", orgId)
  if (error) return { error: error.message }
  revalidatePath("/inventario")
  return { error: null }
}
