"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

async function getOrgId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", user.id).single()
  return profile?.org_id ?? null
}

export async function generateRequisition(eventId: string) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { data: null, error: "No autenticado" }

  const { data: existing } = await supabase
    .from("requisitions")
    .select("id")
    .eq("event_id", eventId)
    .maybeSingle()

  if (existing) return { data: null, error: "Ya existe una requisición para este evento" }

  const { data: event } = await supabase
    .from("events")
    .select("guest_count")
    .eq("id", eventId)
    .single()

  if (!event) return { data: null, error: "Evento no encontrado" }

  const { data: quote } = await supabase
    .from("quotes")
    .select("id, quote_line_items(type, reference_id, quantity)")
    .eq("event_id", eventId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!quote) return { data: null, error: "No hay cotización para este evento" }

  const dishItems = (quote.quote_line_items ?? []).filter(
    (li) => li.type === "dish" && li.reference_id
  )
  if (dishItems.length === 0) return { data: null, error: "La cotización no tiene platillos" }

  const dishIds = dishItems.map((li) => li.reference_id!)
  const { data: dishes } = await supabase
    .from("dishes")
    .select("id, servings_yield, recipe_items(quantity, ingredients(id, name, unit, current_price))")
    .in("id", dishIds)

  if (!dishes) return { data: null, error: "Error al cargar platillos" }

  type IngRow = { id: string; name: string; unit: string; current_price: number }

  const ingredientMap = new Map<string, { ingredient_id: string; quantity: number; unit: string; unit_cost: number }>()

  for (const li of dishItems) {
    const dish = dishes.find((d) => d.id === li.reference_id)
    if (!dish) continue
    const guestCount = li.quantity
    // servings_yield: how many portions one recipe batch produces.
    // e.g. yield=10 for 200 guests → need 20 batches, not 200.
    const yield_ = (dish as { servings_yield?: number }).servings_yield ?? 1
    const batches = yield_ > 0 ? guestCount / yield_ : guestCount

    for (const ri of dish.recipe_items) {
      const ing = ri.ingredients as IngRow | null
      if (!ing) continue
      const totalQty = ri.quantity * batches
      const prev = ingredientMap.get(ing.id)
      if (prev) {
        prev.quantity += totalQty
      } else {
        ingredientMap.set(ing.id, {
          ingredient_id: ing.id,
          quantity: totalQty,
          unit: ing.unit,
          unit_cost: ing.current_price,
        })
      }
    }
  }

  if (ingredientMap.size === 0) return { data: null, error: "Los platillos no tienen recetas configuradas" }

  const { data: requisition, error: reqError } = await supabase
    .from("requisitions")
    .insert({ event_id: eventId, org_id: orgId, status: "generada" })
    .select()
    .single()

  if (reqError) return { data: null, error: reqError.message }

  const items = Array.from(ingredientMap.values()).map((item) => ({
    requisition_id: requisition.id,
    ingredient_id: item.ingredient_id,
    quantity: Math.round(item.quantity * 1000) / 1000,
    unit: item.unit,
    unit_cost: item.unit_cost,
    total_cost: Math.round(item.quantity * item.unit_cost * 100) / 100,
  }))

  const { error: itemsError } = await supabase.from("requisition_items").insert(items)
  if (itemsError) return { data: null, error: itemsError.message }

  revalidatePath(`/eventos/${eventId}`)
  revalidatePath("/requisiciones")

  const { data: full } = await supabase
    .from("requisitions")
    .select("*, requisition_items(*, ingredients(id, name, unit, current_price, preferred_supplier_id))")
    .eq("id", requisition.id)
    .single()

  return { data: full, error: null }
}

export async function updateRequisitionStatus(id: string, eventId: string, status: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("requisitions").update({ status }).eq("id", id)
  if (error) return { error: error.message }
  revalidatePath(`/eventos/${eventId}`)
  revalidatePath("/requisiciones")
  return { error: null }
}

export async function deleteRequisition(id: string, eventId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("requisitions").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidatePath(`/eventos/${eventId}`)
  revalidatePath("/requisiciones")
  return { error: null }
}

export async function generatePurchaseOrders(requisitionId: string, eventId: string) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { data: null, error: "No autenticado" }

  const { data: existingPOs } = await supabase
    .from("purchase_orders")
    .select("id")
    .eq("requisition_id", requisitionId)

  if ((existingPOs ?? []).length > 0)
    return { data: null, error: "Ya existen órdenes de compra para esta requisición" }

  type ReqItem = {
    ingredient_id: string
    quantity: number
    unit: string
    unit_cost: number
    total_cost: number
    ingredients: { id: string; name: string; unit: string; current_price: number; preferred_supplier_id: string | null } | null
  }

  const { data: rawItems } = await supabase
    .from("requisition_items")
    .select("*, ingredients(id, name, unit, current_price, preferred_supplier_id)")
    .eq("requisition_id", requisitionId)

  const items = rawItems as unknown as ReqItem[] | null

  if (!items || items.length === 0) return { data: null, error: "La requisición no tiene ítems" }

  const { data: event } = await supabase
    .from("events")
    .select("event_date")
    .eq("id", eventId)
    .single()

  if (!event) return { data: null, error: "Evento no encontrado" }

  const eventDate = new Date(event.event_date + "T12:00:00")
  eventDate.setDate(eventDate.getDate() - 7)
  const buyByDate = eventDate.toISOString().slice(0, 10)

  const supplierMap = new Map<string, ReqItem[]>()
  for (const item of items) {
    const key = item.ingredients?.preferred_supplier_id ?? "no_supplier"
    if (!supplierMap.has(key)) supplierMap.set(key, [])
    supplierMap.get(key)!.push(item)
  }

  const createdPOs = []
  for (const [key, groupItems] of supplierMap.entries()) {
    const supplierId = key === "no_supplier" ? null : key
    const subtotal = groupItems.reduce((s, i) => s + i.total_cost, 0)

    const { data: po, error: poError } = await supabase
      .from("purchase_orders")
      .insert({
        org_id: orgId,
        requisition_id: requisitionId,
        event_id: eventId,
        supplier_id: supplierId,
        status: "pendiente",
        buy_by_date: buyByDate,
        subtotal,
      })
      .select()
      .single()

    if (poError) return { data: null, error: poError.message }

    const poItems = groupItems.map((item) => ({
      purchase_order_id: po.id,
      ingredient_id: item.ingredient_id,
      quantity: item.quantity,
      unit: item.unit,
      unit_cost: item.unit_cost,
      total_cost: item.total_cost,
    }))

    const { error: poItemsError } = await supabase.from("purchase_order_items").insert(poItems)
    if (poItemsError) return { data: null, error: poItemsError.message }

    createdPOs.push(po)
  }

  revalidatePath(`/eventos/${eventId}`)
  revalidatePath("/ordenes-compra")
  return { data: createdPOs, error: null }
}

export async function updatePOStatus(
  id: string,
  eventId: string,
  status: string,
  receivedAt?: string
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("purchase_orders")
    .update({ status, received_at: receivedAt ?? null })
    .eq("id", id)
  if (error) return { error: error.message }
  revalidatePath(`/eventos/${eventId}`)
  revalidatePath("/ordenes-compra")
  return { error: null }
}
