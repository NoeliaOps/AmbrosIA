"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { postMovement, defaultWarehouseId } from "@/lib/inventory"

type SB = Awaited<ReturnType<typeof createClient>>

async function getOrgId(supabase: SB) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", user.id).single()
  return profile?.org_id ?? null
}

async function currentPrice(supabase: SB, ingredientId: string) {
  const { data } = await supabase.from("ingredients").select("current_price").eq("id", ingredientId).maybeSingle()
  return data?.current_price ?? null
}

// ── Almacenes ─────────────────────────────────────────────────────────────────
export async function createWarehouse(data: { name: string; location?: string; is_default?: boolean }) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { data: null, error: "No autenticado" }
  if (!data.name.trim()) return { data: null, error: "El nombre es requerido" }
  if (data.is_default) await supabase.from("warehouses").update({ is_default: false }).eq("org_id", orgId).eq("is_default", true)
  const { data: row, error } = await supabase
    .from("warehouses")
    .insert({ org_id: orgId, name: data.name.trim(), location: data.location || null, is_default: !!data.is_default })
    .select("id, name, location, is_default, is_active")
    .single()
  if (error) return { data: null, error: error.message }
  revalidatePath("/inventario")
  return { data: row, error: null }
}

export async function updateWarehouse(id: string, data: { name: string; location?: string; is_default?: boolean; is_active?: boolean }) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { data: null, error: "No autenticado" }
  if (data.is_default) await supabase.from("warehouses").update({ is_default: false }).eq("org_id", orgId).eq("is_default", true)
  const { data: row, error } = await supabase
    .from("warehouses")
    .update({ name: data.name.trim(), location: data.location ?? null, is_default: data.is_default, is_active: data.is_active })
    .eq("id", id).eq("org_id", orgId)
    .select("id, name, location, is_default, is_active")
    .single()
  if (error) return { data: null, error: error.message }
  revalidatePath("/inventario")
  return { data: row, error: null }
}

export async function deleteWarehouse(id: string) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { error: "No autenticado" }
  const { data: all } = await supabase.from("warehouses").select("id, is_default").eq("org_id", orgId)
  const list = all ?? []
  if (list.length <= 1) return { error: "Debe existir al menos un almacén." }
  if (list.find((w) => w.id === id)?.is_default) return { error: "No puedes eliminar el almacén predeterminado." }
  const { error } = await supabase.from("warehouses").delete().eq("id", id).eq("org_id", orgId)
  if (error) return { error: error.message }
  revalidatePath("/inventario")
  return { error: null }
}

export async function setDefaultWarehouse(id: string) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { error: "No autenticado" }
  await supabase.from("warehouses").update({ is_default: false }).eq("org_id", orgId).eq("is_default", true)
  const { error } = await supabase.from("warehouses").update({ is_default: true }).eq("id", id).eq("org_id", orgId)
  if (error) return { error: error.message }
  revalidatePath("/inventario")
  return { error: null }
}

// ── Existencias ───────────────────────────────────────────────────────────────
export async function addStockItem(warehouseId: string, ingredientId: string, minQuantity: number) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { data: null, error: "No autenticado" }
  const { data: row, error } = await supabase
    .from("inventory_items")
    .insert({ org_id: orgId, warehouse_id: warehouseId, ingredient_id: ingredientId, quantity: 0, min_quantity: Math.max(0, minQuantity || 0) })
    .select("id, ingredient_id, quantity, min_quantity")
    .single()
  if (error) {
    if (error.code === "23505") return { data: null, error: "Ese insumo ya está en este almacén" }
    return { data: null, error: error.message }
  }
  revalidatePath("/inventario")
  return { data: row, error: null }
}

export async function setMinQuantity(itemId: string, min: number) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { error: "No autenticado" }
  const { error } = await supabase.from("inventory_items").update({ min_quantity: Math.max(0, min || 0) }).eq("id", itemId).eq("org_id", orgId)
  if (error) return { error: error.message }
  revalidatePath("/inventario")
  return { error: null }
}

export async function removeStockItem(itemId: string) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { error: "No autenticado" }
  const { error } = await supabase.from("inventory_items").delete().eq("id", itemId).eq("org_id", orgId)
  if (error) return { error: error.message }
  revalidatePath("/inventario")
  return { error: null }
}

// ── Movimientos ───────────────────────────────────────────────────────────────
export async function adjustStock(warehouseId: string, ingredientId: string, newQuantity: number, notes?: string) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { error: "No autenticado" }
  const { data: item } = await supabase.from("inventory_items").select("quantity").eq("warehouse_id", warehouseId).eq("ingredient_id", ingredientId).maybeSingle()
  const current = item?.quantity ?? 0
  const delta = Math.round((newQuantity - current) * 1000) / 1000
  if (delta === 0) return { error: null }
  const res = await postMovement(supabase, orgId, { warehouse_id: warehouseId, ingredient_id: ingredientId, quantity: delta, type: "ajuste", unit_cost: await currentPrice(supabase, ingredientId), reference: "Ajuste de existencia", notes: notes || null })
  if (res.error) return { error: res.error }
  revalidatePath("/inventario")
  return { error: null }
}

export async function stockEntry(warehouseId: string, ingredientId: string, qty: number, unitCost: number | null, reference?: string, notes?: string) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { error: "No autenticado" }
  if (!qty || qty <= 0) return { error: "La cantidad debe ser mayor a 0" }
  const cost = unitCost != null ? unitCost : await currentPrice(supabase, ingredientId)
  const res = await postMovement(supabase, orgId, { warehouse_id: warehouseId, ingredient_id: ingredientId, quantity: Math.abs(qty), type: "entrada", unit_cost: cost, reference: reference || "Entrada manual", notes: notes || null })
  if (res.error) return { error: res.error }
  revalidatePath("/inventario")
  return { error: null }
}

export async function stockExit(warehouseId: string, ingredientId: string, qty: number, reference?: string, notes?: string) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { error: "No autenticado" }
  if (!qty || qty <= 0) return { error: "La cantidad debe ser mayor a 0" }
  const res = await postMovement(supabase, orgId, { warehouse_id: warehouseId, ingredient_id: ingredientId, quantity: -Math.abs(qty), type: "salida", unit_cost: await currentPrice(supabase, ingredientId), reference: reference || "Salida manual", notes: notes || null })
  if (res.error) return { error: res.error }
  revalidatePath("/inventario")
  return { error: null }
}

export async function transferStock(fromWarehouseId: string, toWarehouseId: string, ingredientId: string, qty: number, notes?: string) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { error: "No autenticado" }
  if (fromWarehouseId === toWarehouseId) return { error: "Selecciona almacenes distintos" }
  if (!qty || qty <= 0) return { error: "La cantidad debe ser mayor a 0" }
  const group = crypto.randomUUID()
  const cost = await currentPrice(supabase, ingredientId)
  const out = await postMovement(supabase, orgId, { warehouse_id: fromWarehouseId, ingredient_id: ingredientId, quantity: -Math.abs(qty), type: "traspaso_salida", unit_cost: cost, reference: "Traspaso entre almacenes", transfer_group: group, notes: notes || null })
  if (out.error) return { error: out.error }
  const inn = await postMovement(supabase, orgId, { warehouse_id: toWarehouseId, ingredient_id: ingredientId, quantity: Math.abs(qty), type: "traspaso_entrada", unit_cost: cost, reference: "Traspaso entre almacenes", transfer_group: group, notes: notes || null })
  if (inn.error) return { error: inn.error }
  revalidatePath("/inventario")
  return { error: null }
}

// ── Conexión: consumo de un evento (descuenta la requisición del almacén) ──────
export async function consumeEvent(eventId: string, warehouseId?: string) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { error: "No autenticado" }

  const targetWarehouse = warehouseId || (await defaultWarehouseId(supabase, orgId))
  if (!targetWarehouse) return { error: "No hay almacén configurado." }

  const { data: req } = await supabase
    .from("requisitions")
    .select("id, requisition_items(ingredient_id, quantity)")
    .eq("event_id", eventId)
    .maybeSingle()
  const reqItems = (req?.requisition_items ?? []) as { ingredient_id: string; quantity: number }[]
  if (reqItems.length === 0) return { error: "El evento no tiene requisición con insumos." }

  const ids = reqItems.map((i) => i.ingredient_id)
  const { data: priceRows } = await supabase.from("ingredients").select("id, current_price").in("id", ids)
  const priceMap = new Map((priceRows ?? []).map((p) => [p.id, p.current_price]))

  for (const it of reqItems) {
    await postMovement(supabase, orgId, {
      warehouse_id: targetWarehouse, ingredient_id: it.ingredient_id, quantity: -Math.abs(it.quantity), type: "salida",
      unit_cost: priceMap.get(it.ingredient_id) ?? null, reference: "Consumo de evento", event_id: eventId,
    })
  }
  revalidatePath("/inventario")
  revalidatePath(`/eventos/${eventId}`)
  return { error: null }
}
