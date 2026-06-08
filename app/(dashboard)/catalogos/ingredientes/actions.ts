"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const ingredientSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  unit: z.string().min(1, "La unidad es requerida"),
  category: z.string().optional(),
  current_price: z.number().min(0, "El precio debe ser positivo"),
  preferred_supplier_id: z.string().uuid().optional().nullable(),
  notes: z.string().optional(),
})

export type IngredientFormData = z.infer<typeof ingredientSchema>

async function getOrgId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", user.id).single()
  return profile?.org_id ?? null
}

export async function createIngredient(data: IngredientFormData) {
  const parsed = ingredientSchema.safeParse(data)
  if (!parsed.success) return { data: null, error: "Datos inválidos" }

  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { data: null, error: "No autenticado" }

  const { data: ingredient, error } = await supabase
    .from("ingredients")
    .insert({ ...parsed.data, org_id: orgId })
    .select("id")
    .single()

  if (error) return { data: null, error: error.message }

  // Record initial price
  await supabase.from("ingredient_price_history").insert({
    ingredient_id: ingredient.id,
    price: parsed.data.current_price,
    notes: "Precio inicial",
  })

  // Crea la presentación de compra base (1 [unidad] = 1 unidad base, precio inicial),
  // predeterminada. Luego el usuario puede agregar kg/caja/pieza con sus equivalencias.
  await supabase.from("ingredient_purchase_units").insert({
    org_id: orgId,
    ingredient_id: ingredient.id,
    unit: parsed.data.unit,
    factor: 1,
    price: parsed.data.current_price,
    supplier_id: parsed.data.preferred_supplier_id ?? null,
    is_default: true,
    whole_units: false,
  })

  const { data: full } = await supabase
    .from("ingredients")
    .select("*, suppliers(name), ingredient_purchase_units(id, unit, factor, price, supplier_id, is_default, whole_units)")
    .eq("id", ingredient.id)
    .single()

  revalidatePath("/catalogos/ingredientes")
  return { data: full, error: null }
}

export async function updateIngredient(id: string, data: IngredientFormData, prevPrice: number) {
  const parsed = ingredientSchema.safeParse(data)
  if (!parsed.success) return { data: null, error: "Datos inválidos" }

  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { data: null, error: "No autenticado" }

  const { data: ingredient, error } = await supabase
    .from("ingredients")
    .update(parsed.data)
    .eq("id", id)
    .eq("org_id", orgId)
    .select("*, suppliers(name)")
    .single()

  if (error) return { data: null, error: error.message }

  // Record price change if it changed
  if (parsed.data.current_price !== prevPrice) {
    await supabase.from("ingredient_price_history").insert({
      ingredient_id: id,
      price: parsed.data.current_price,
      notes: `Actualización desde catálogo (anterior: $${prevPrice})`,
    })
  }

  revalidatePath("/catalogos/ingredientes")
  return { data: ingredient, error: null }
}

export async function deleteIngredient(id: string) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { error: "No autenticado" }

  const { error } = await supabase.from("ingredients").delete().eq("id", id).eq("org_id", orgId)
  if (error) return { error: error.message }
  revalidatePath("/catalogos/ingredientes")
  return { error: null }
}
