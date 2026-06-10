import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/layout/page-header"
import { InventoryClient, type Warehouse, type StockRow, type IngredientOption, type MovementRow } from "./_components/inventory-client"

export const metadata: Metadata = { title: "Inventario" }

export default async function InventarioPage() {
  const supabase = await createClient()

  const [{ data: warehouses }, { data: stock }, { data: ingredients }, { data: movements }] = await Promise.all([
    supabase.from("warehouses").select("id, name, location, type, is_default, is_active").order("is_default", { ascending: false }).order("name"),
    supabase.from("inventory_items").select("id, warehouse_id, ingredient_id, quantity, min_quantity, ingredients(name, unit, category, current_price)").order("ingredient_id"),
    supabase.from("ingredients").select("id, name, unit, current_price").order("name"),
    supabase.from("inventory_movements").select("id, warehouse_id, ingredient_id, type, quantity, unit_cost, reference, created_at, ingredients(name, unit)").order("created_at", { ascending: false }).limit(300),
  ])

  return (
    <div className="space-y-6">
      <PageHeader title="Inventario" description="Existencias por almacén, movimientos y conexión con compras y eventos." />
      <InventoryClient
        warehouses={(warehouses ?? []) as Warehouse[]}
        stock={(stock ?? []) as unknown as StockRow[]}
        ingredients={(ingredients ?? []) as IngredientOption[]}
        movements={(movements ?? []) as unknown as MovementRow[]}
      />
    </div>
  )
}
