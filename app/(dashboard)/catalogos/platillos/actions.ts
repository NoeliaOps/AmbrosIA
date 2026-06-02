"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const recipeItemSchema = z.object({
  ingredient_id: z.string().uuid(),
  quantity: z.number().positive("La cantidad debe ser mayor a 0"),
  notes: z.string().optional(),
})

const dishSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  category: z.string().optional(),
  servings_yield: z.number().int().positive("El rendimiento debe ser mayor a 0"),
  notes: z.string().optional(),
  recipe: z.array(recipeItemSchema),
})

export type DishFormData = z.infer<typeof dishSchema>

async function getOrgId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", user.id).single()
  return profile?.org_id ?? null
}

export async function createDish(data: DishFormData) {
  const parsed = dishSchema.safeParse(data)
  if (!parsed.success) return { data: null, error: "Datos inválidos" }

  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { data: null, error: "No autenticado" }

  const { data: dish, error } = await supabase
    .from("dishes")
    .insert({
      name: parsed.data.name,
      category: parsed.data.category,
      servings_yield: parsed.data.servings_yield,
      notes: parsed.data.notes,
      org_id: orgId,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  if (parsed.data.recipe.length > 0) {
    const { error: recipeError } = await supabase.from("recipe_items").insert(
      parsed.data.recipe.map((item) => ({ ...item, dish_id: dish.id }))
    )
    if (recipeError) return { data: null, error: recipeError.message }
  }

  revalidatePath("/catalogos/platillos")
  return { data: dish, error: null }
}

export async function updateDish(id: string, data: DishFormData) {
  const parsed = dishSchema.safeParse(data)
  if (!parsed.success) return { data: null, error: "Datos inválidos" }

  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { data: null, error: "No autenticado" }

  const { data: dish, error } = await supabase
    .from("dishes")
    .update({
      name: parsed.data.name,
      category: parsed.data.category,
      servings_yield: parsed.data.servings_yield,
      notes: parsed.data.notes,
    })
    .eq("id", id)
    .eq("org_id", orgId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  // Replace all recipe items
  await supabase.from("recipe_items").delete().eq("dish_id", id)
  if (parsed.data.recipe.length > 0) {
    await supabase.from("recipe_items").insert(
      parsed.data.recipe.map((item) => ({ ...item, dish_id: id }))
    )
  }

  revalidatePath("/catalogos/platillos")
  return { data: dish, error: null }
}

export async function deleteDish(id: string) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { error: "No autenticado" }

  const { error } = await supabase.from("dishes").delete().eq("id", id).eq("org_id", orgId)
  if (error) return { error: error.message }
  revalidatePath("/catalogos/platillos")
  return { error: null }
}
