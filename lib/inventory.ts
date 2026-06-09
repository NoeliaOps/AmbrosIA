import type { createClient } from "@/lib/supabase/server"

type SB = Awaited<ReturnType<typeof createClient>>

export type MovementType = "entrada" | "salida" | "ajuste" | "traspaso_entrada" | "traspaso_salida"

export type MovementInput = {
  warehouse_id: string
  ingredient_id: string
  quantity: number // en unidad base, con signo (+ entrada, − salida)
  type: MovementType
  unit_cost?: number | null
  reference?: string | null
  event_id?: string | null
  purchase_order_id?: string | null
  transfer_group?: string | null
  notes?: string | null
}

// Aplica el delta a la existencia (almacén × insumo), creando la fila si no existe.
export async function applyToStock(supabase: SB, orgId: string, warehouseId: string, ingredientId: string, delta: number) {
  const { data: existing } = await supabase
    .from("inventory_items")
    .select("id, quantity")
    .eq("warehouse_id", warehouseId)
    .eq("ingredient_id", ingredientId)
    .maybeSingle()
  if (existing) {
    const next = Math.round(((existing.quantity ?? 0) + delta) * 1000) / 1000
    await supabase.from("inventory_items").update({ quantity: next }).eq("id", existing.id)
  } else {
    await supabase.from("inventory_items").insert({
      org_id: orgId, warehouse_id: warehouseId, ingredient_id: ingredientId,
      quantity: Math.round(delta * 1000) / 1000, min_quantity: 0,
    })
  }
}

// Registra un movimiento en el kardex y actualiza la existencia.
export async function postMovement(supabase: SB, orgId: string, m: MovementInput) {
  const { error } = await supabase.from("inventory_movements").insert({
    org_id: orgId,
    warehouse_id: m.warehouse_id,
    ingredient_id: m.ingredient_id,
    type: m.type,
    quantity: Math.round(m.quantity * 1000) / 1000,
    unit_cost: m.unit_cost ?? null,
    reference: m.reference ?? null,
    event_id: m.event_id ?? null,
    purchase_order_id: m.purchase_order_id ?? null,
    transfer_group: m.transfer_group ?? null,
    notes: m.notes ?? null,
  })
  if (error) return { error: error.message }
  await applyToStock(supabase, orgId, m.warehouse_id, m.ingredient_id, m.quantity)
  return { error: null }
}

export async function defaultWarehouseId(supabase: SB, orgId: string): Promise<string | null> {
  const { data } = await supabase
    .from("warehouses")
    .select("id")
    .eq("org_id", orgId)
    .eq("is_default", true)
    .maybeSingle()
  return data?.id ?? null
}
