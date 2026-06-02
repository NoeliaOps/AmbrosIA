"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const menuDishSchema = z.object({
  dish_id: z.string().uuid(),
  servings: z.number().int().positive("Las porciones deben ser mayor a 0"),
  notes: z.string().optional(),
})

const menuSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  event_type: z.string().optional(),
  notes: z.string().optional(),
  dishes: z.array(menuDishSchema),
})

export type MenuFormData = z.infer<typeof menuSchema>

async function getOrgId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", user.id).single()
  return profile?.org_id ?? null
}

export async function createMenu(data: MenuFormData) {
  const parsed = menuSchema.safeParse(data)
  if (!parsed.success) return { data: null, error: "Datos inválidos" }

  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { data: null, error: "No autenticado" }

  const { data: menu, error } = await supabase
    .from("menus")
    .insert({
      name: parsed.data.name,
      event_type: parsed.data.event_type,
      notes: parsed.data.notes,
      org_id: orgId,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  if (parsed.data.dishes.length > 0) {
    const { error: dishError } = await supabase.from("menu_dishes").insert(
      parsed.data.dishes.map((d) => ({ ...d, menu_id: menu.id }))
    )
    if (dishError) return { data: null, error: dishError.message }
  }

  revalidatePath("/catalogos/menus")
  return { data: menu, error: null }
}

export async function updateMenu(id: string, data: MenuFormData) {
  const parsed = menuSchema.safeParse(data)
  if (!parsed.success) return { data: null, error: "Datos inválidos" }

  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { data: null, error: "No autenticado" }

  const { data: menu, error } = await supabase
    .from("menus")
    .update({
      name: parsed.data.name,
      event_type: parsed.data.event_type,
      notes: parsed.data.notes,
    })
    .eq("id", id)
    .eq("org_id", orgId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  await supabase.from("menu_dishes").delete().eq("menu_id", id)
  if (parsed.data.dishes.length > 0) {
    await supabase.from("menu_dishes").insert(
      parsed.data.dishes.map((d) => ({ ...d, menu_id: id }))
    )
  }

  revalidatePath("/catalogos/menus")
  return { data: menu, error: null }
}

export async function deleteMenu(id: string) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { error: "No autenticado" }

  const { error } = await supabase.from("menus").delete().eq("id", id).eq("org_id", orgId)
  if (error) return { error: error.message }
  revalidatePath("/catalogos/menus")
  return { error: null }
}
