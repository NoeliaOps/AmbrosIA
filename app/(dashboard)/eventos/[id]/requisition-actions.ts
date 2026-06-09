"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { purchaseFromBase } from "@/lib/units"
import { postMovement, defaultWarehouseId } from "@/lib/inventory"

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

  type IngRow = { id: string; name: string; unit: string; current_price: number }
  type DishWithRecipe = { id: string; servings_yield: number | null; recipe_items: { quantity: number; ingredients: IngRow | null }[] }
  // Cada fuente aporta un platillo y cuántas porciones se preparan de él.
  type Source = { dish: DishWithRecipe | null | undefined; servings: number }

  let sources: Source[] = []

  // Fuente primaria: el MENÚ del evento (event_dishes).
  const { data: eventDishes } = await supabase
    .from("event_dishes")
    .select("servings, dishes(id, servings_yield, recipe_items(quantity, ingredients(id, name, unit, current_price)))")
    .eq("event_id", eventId)

  if (eventDishes && eventDishes.length > 0) {
    sources = eventDishes.map((ed) => ({ dish: ed.dishes as unknown as DishWithRecipe, servings: ed.servings }))
  } else {
    // Fallback: platillos de la cotización (para eventos sin menú definido).
    const { data: quote } = await supabase
      .from("quotes")
      .select("id, quote_line_items(type, reference_id, quantity)")
      .eq("event_id", eventId)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle()

    const dishItems = (quote?.quote_line_items ?? []).filter((li) => li.type === "dish" && li.reference_id)
    if (dishItems.length === 0) {
      return { data: null, error: "Define el menú del evento (pestaña Menú) o agrega platillos a la cotización antes de generar la requisición." }
    }
    const dishIds = dishItems.map((li) => li.reference_id!)
    const { data: dishes } = await supabase
      .from("dishes")
      .select("id, servings_yield, recipe_items(quantity, ingredients(id, name, unit, current_price))")
      .in("id", dishIds)
    sources = dishItems.map((li) => ({
      dish: (dishes ?? []).find((d) => d.id === li.reference_id) as unknown as DishWithRecipe | undefined,
      servings: li.quantity,
    }))
  }

  const ingredientMap = new Map<string, { ingredient_id: string; quantity: number; unit: string; unit_cost: number }>()

  for (const src of sources) {
    const dish = src.dish
    if (!dish) continue
    // servings_yield: cuántas porciones produce una "tanda" de la receta.
    // p. ej. yield=10 para 200 porciones → 20 tandas, no 200.
    const yield_ = dish.servings_yield ?? 1
    const batches = yield_ > 0 ? src.servings / yield_ : src.servings

    for (const ri of dish.recipe_items) {
      const ing = ri.ingredients as IngRow | null
      if (!ing) continue
      const totalQty = ri.quantity * batches
      const prev = ingredientMap.get(ing.id)
      if (prev) {
        prev.quantity += totalQty
      } else {
        ingredientMap.set(ing.id, { ingredient_id: ing.id, quantity: totalQty, unit: ing.unit, unit_cost: ing.current_price })
      }
    }
  }

  if (ingredientMap.size === 0) return { data: null, error: "Los platillos del menú no tienen recetas configuradas" }

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

  // Presentación de compra predeterminada por insumo (para convertir la necesidad
  // en unidad base → cantidad a comprar en su presentación: caja, kg, pieza…).
  type PU = { ingredient_id: string; unit: string; factor: number; price: number; supplier_id: string | null; whole_units: boolean }
  const { data: puRows } = await supabase
    .from("ingredient_purchase_units")
    .select("ingredient_id, unit, factor, price, supplier_id, whole_units")
    .in("ingredient_id", items.map((i) => i.ingredient_id))
    .eq("is_default", true)
  const defByIngredient = new Map<string, PU>()
  for (const r of (puRows ?? []) as PU[]) defByIngredient.set(r.ingredient_id, r)

  // Convierte cada ítem a su presentación de compra.
  type Line = { ingredient_id: string; unit: string; quantity: number; unit_cost: number; total_cost: number; supplierKey: string }
  const lines: Line[] = items.map((item) => {
    const def = defByIngredient.get(item.ingredient_id)
    if (def) {
      const qty = purchaseFromBase(item.quantity, { factor: def.factor, whole_units: def.whole_units })
      return {
        ingredient_id: item.ingredient_id,
        unit: def.unit,
        quantity: qty,
        unit_cost: def.price,
        total_cost: Math.round(qty * def.price * 100) / 100,
        supplierKey: def.supplier_id ?? item.ingredients?.preferred_supplier_id ?? "no_supplier",
      }
    }
    // Fallback: sin presentación (no debería ocurrir) → unidad base tal cual.
    return {
      ingredient_id: item.ingredient_id,
      unit: item.unit,
      quantity: item.quantity,
      unit_cost: item.unit_cost,
      total_cost: item.total_cost,
      supplierKey: item.ingredients?.preferred_supplier_id ?? "no_supplier",
    }
  })

  const supplierMap = new Map<string, Line[]>()
  for (const line of lines) {
    if (!supplierMap.has(line.supplierKey)) supplierMap.set(line.supplierKey, [])
    supplierMap.get(line.supplierKey)!.push(line)
  }

  const createdPOs = []
  for (const [key, groupLines] of supplierMap.entries()) {
    const supplierId = key === "no_supplier" ? null : key
    const subtotal = Math.round(groupLines.reduce((s, i) => s + i.total_cost, 0) * 100) / 100

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

    const poItems = groupLines.map((line) => ({
      purchase_order_id: po.id,
      ingredient_id: line.ingredient_id,
      quantity: line.quantity,
      unit: line.unit,
      unit_cost: line.unit_cost,
      total_cost: line.total_cost,
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
  const orgId = await getOrgId(supabase)
  if (!orgId) return { error: "No autenticado" }

  // Estado previo para detectar la transición a/desde "recibida".
  const { data: prev } = await supabase.from("purchase_orders").select("status").eq("id", id).maybeSingle()
  const wasReceived = prev?.status === "recibida"

  const { error } = await supabase
    .from("purchase_orders")
    .update({ status, received_at: receivedAt ?? null })
    .eq("id", id)
  if (error) return { error: error.message }

  // Conexión con inventario: recibir = entrada al almacén predeterminado
  // (convirtiendo la presentación de compra a unidad base); revertir = salida.
  const nowReceived = status === "recibida"
  if (nowReceived !== wasReceived) {
    const warehouseId = await defaultWarehouseId(supabase, orgId)
    const { data: poItems } = await supabase
      .from("purchase_order_items")
      .select("ingredient_id, quantity, unit, unit_cost")
      .eq("purchase_order_id", id)
    const lineItems = poItems ?? []
    if (warehouseId && lineItems.length > 0) {
      const ids = [...new Set(lineItems.map((i) => i.ingredient_id))]
      const { data: puRows } = await supabase.from("ingredient_purchase_units").select("ingredient_id, unit, factor").in("ingredient_id", ids)
      const factorOf = (ingId: string, unit: string): number => {
        const rows = (puRows ?? []).filter((r) => r.ingredient_id === ingId)
        return rows.find((r) => r.unit === unit)?.factor ?? rows[0]?.factor ?? 1
      }
      for (const it of lineItems) {
        const factor = factorOf(it.ingredient_id, it.unit)
        const baseQty = it.quantity * factor
        const baseCost = factor > 0 ? Math.round((it.unit_cost / factor) * 100) / 100 : it.unit_cost
        await postMovement(supabase, orgId, {
          warehouse_id: warehouseId,
          ingredient_id: it.ingredient_id,
          quantity: nowReceived ? Math.abs(baseQty) : -Math.abs(baseQty),
          type: nowReceived ? "entrada" : "salida",
          unit_cost: baseCost,
          reference: nowReceived ? "Recepción de OC" : "Reversa de recepción de OC",
          purchase_order_id: id,
        })
      }
    }
  }

  revalidatePath(`/eventos/${eventId}`)
  revalidatePath("/ordenes-compra")
  revalidatePath("/inventario")
  return { error: null }
}
