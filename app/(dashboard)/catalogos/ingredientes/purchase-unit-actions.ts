"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { basePriceFrom } from "@/lib/units"

const schema = z.object({
  unit: z.string().min(1, "La unidad es requerida"),
  factor: z.number().positive("La equivalencia debe ser mayor a 0"),
  price: z.number().min(0, "El precio debe ser positivo"),
  supplier_id: z.string().uuid().nullable().optional(),
  whole_units: z.boolean(),
  is_default: z.boolean(),
})
export type PurchaseUnitFormData = z.infer<typeof schema>

type SB = Awaited<ReturnType<typeof createClient>>

async function getOrgId(supabase: SB) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", user.id).single()
  return profile?.org_id ?? null
}

// Recalcula ingredients.current_price desde la presentación predeterminada y
// registra el cambio en el historial de precios cuando cambia.
async function recomputeIngredientPrice(supabase: SB, ingredientId: string, orgId: string) {
  const { data: def } = await supabase
    .from("ingredient_purchase_units")
    .select("price, factor")
    .eq("ingredient_id", ingredientId)
    .eq("is_default", true)
    .maybeSingle()
  if (!def) return
  const newPrice = basePriceFrom(def)
  const { data: ing } = await supabase.from("ingredients").select("current_price").eq("id", ingredientId).maybeSingle()
  if (!ing) return
  if (Math.abs((ing.current_price ?? 0) - newPrice) > 0.0001) {
    await supabase.from("ingredients").update({ current_price: newPrice }).eq("id", ingredientId).eq("org_id", orgId)
    await supabase.from("ingredient_price_history").insert({ ingredient_id: ingredientId, price: newPrice, notes: "Derivado de presentación de compra" })
  }
}

async function clearDefault(supabase: SB, ingredientId: string, orgId: string) {
  await supabase.from("ingredient_purchase_units").update({ is_default: false }).eq("ingredient_id", ingredientId).eq("org_id", orgId).eq("is_default", true)
}

export async function createPurchaseUnit(ingredientId: string, data: PurchaseUnitFormData) {
  const parsed = schema.safeParse(data)
  if (!parsed.success) return { data: null, error: "Datos inválidos" }

  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { data: null, error: "No autenticado" }

  const { data: ing } = await supabase.from("ingredients").select("id").eq("id", ingredientId).eq("org_id", orgId).maybeSingle()
  if (!ing) return { data: null, error: "Insumo no encontrado" }

  if (parsed.data.is_default) await clearDefault(supabase, ingredientId, orgId)

  const { data: row, error } = await supabase
    .from("ingredient_purchase_units")
    .insert({
      org_id: orgId, ingredient_id: ingredientId,
      unit: parsed.data.unit, factor: parsed.data.factor, price: parsed.data.price,
      supplier_id: parsed.data.supplier_id ?? null,
      is_default: parsed.data.is_default, whole_units: parsed.data.whole_units,
    })
    .select("id, unit, factor, price, supplier_id, is_default, whole_units")
    .single()

  if (error) return { data: null, error: error.message }
  await recomputeIngredientPrice(supabase, ingredientId, orgId)
  revalidatePath("/catalogos/ingredientes")
  return { data: row, error: null }
}

export async function updatePurchaseUnit(id: string, ingredientId: string, data: PurchaseUnitFormData) {
  const parsed = schema.safeParse(data)
  if (!parsed.success) return { data: null, error: "Datos inválidos" }

  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { data: null, error: "No autenticado" }

  if (parsed.data.is_default) await clearDefault(supabase, ingredientId, orgId)

  const { data: row, error } = await supabase
    .from("ingredient_purchase_units")
    .update({
      unit: parsed.data.unit, factor: parsed.data.factor, price: parsed.data.price,
      supplier_id: parsed.data.supplier_id ?? null,
      is_default: parsed.data.is_default, whole_units: parsed.data.whole_units,
    })
    .eq("id", id)
    .eq("org_id", orgId)
    .select("id, unit, factor, price, supplier_id, is_default, whole_units")
    .single()

  if (error) return { data: null, error: error.message }
  await recomputeIngredientPrice(supabase, ingredientId, orgId)
  revalidatePath("/catalogos/ingredientes")
  return { data: row, error: null }
}

export async function deletePurchaseUnit(id: string, ingredientId: string) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { error: "No autenticado" }

  const { data: all } = await supabase
    .from("ingredient_purchase_units")
    .select("id, is_default")
    .eq("ingredient_id", ingredientId)
    .eq("org_id", orgId)
  const list = all ?? []
  if (list.length <= 1) return { error: "Debe quedar al menos una presentación de compra." }

  const target = list.find((x) => x.id === id)
  const { error } = await supabase.from("ingredient_purchase_units").delete().eq("id", id).eq("org_id", orgId)
  if (error) return { error: error.message }

  // Si se borró la predeterminada, promover otra.
  if (target?.is_default) {
    const next = list.find((x) => x.id !== id)
    if (next) await supabase.from("ingredient_purchase_units").update({ is_default: true }).eq("id", next.id).eq("org_id", orgId)
  }
  await recomputeIngredientPrice(supabase, ingredientId, orgId)
  revalidatePath("/catalogos/ingredientes")
  return { error: null }
}
