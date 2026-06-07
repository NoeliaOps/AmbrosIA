"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

async function getOrgId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", user.id).single()
  return profile?.org_id ?? null
}

export async function addEventDish(eventId: string, dishId: string, servings: number) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { data: null, error: "No autenticado" }
  if (!dishId) return { data: null, error: "Selecciona un platillo" }

  const { data: event } = await supabase.from("events").select("id").eq("id", eventId).eq("org_id", orgId).maybeSingle()
  if (!event) return { data: null, error: "Evento no encontrado" }

  const { data, error } = await supabase
    .from("event_dishes")
    .insert({ org_id: orgId, event_id: eventId, dish_id: dishId, servings: Math.max(1, Math.round(servings || 1)) })
    .select("id, dish_id, servings, sort_order")
    .single()

  if (error) {
    if (error.code === "23505") return { data: null, error: "Ese platillo ya está en el menú" }
    return { data: null, error: error.message }
  }
  revalidatePath(`/eventos/${eventId}`)
  return { data, error: null }
}

export async function updateEventDishServings(id: string, eventId: string, servings: number) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { error: "No autenticado" }

  const { error } = await supabase
    .from("event_dishes")
    .update({ servings: Math.max(1, Math.round(servings || 1)) })
    .eq("id", id)
    .eq("org_id", orgId)

  if (error) return { error: error.message }
  revalidatePath(`/eventos/${eventId}`)
  return { error: null }
}

export async function removeEventDish(id: string, eventId: string) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { error: "No autenticado" }

  const { error } = await supabase.from("event_dishes").delete().eq("id", id).eq("org_id", orgId)
  if (error) return { error: error.message }
  revalidatePath(`/eventos/${eventId}`)
  return { error: null }
}

// Aplica una plantilla de menú (del catálogo) al evento: copia sus platillos y
// porciones. Hace merge — actualiza porciones de los que ya están y agrega los nuevos.
export async function applyMenuTemplate(eventId: string, menuId: string) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { data: null, error: "No autenticado" }
  if (!menuId) return { data: null, error: "Selecciona un menú" }

  const { data: menuDishes } = await supabase
    .from("menu_dishes")
    .select("dish_id, servings, sort_order, menus!inner(org_id)")
    .eq("menu_id", menuId)

  const rows = (menuDishes ?? []) as unknown as { dish_id: string; servings: number; sort_order: number; menus: { org_id: string } | null }[]
  const valid = rows.filter((r) => r.menus?.org_id === orgId)
  if (valid.length === 0) return { data: null, error: "El menú no tiene platillos" }

  const payload = valid.map((r) => ({
    org_id: orgId,
    event_id: eventId,
    dish_id: r.dish_id,
    servings: Math.max(1, Math.round(r.servings || 1)),
    sort_order: r.sort_order ?? 0,
  }))

  const { error } = await supabase
    .from("event_dishes")
    .upsert(payload, { onConflict: "event_id,dish_id" })

  if (error) return { data: null, error: error.message }

  const { data: full } = await supabase
    .from("event_dishes")
    .select("id, dish_id, servings, sort_order")
    .eq("event_id", eventId)
    .order("sort_order")

  revalidatePath(`/eventos/${eventId}`)
  return { data: full, error: null }
}
