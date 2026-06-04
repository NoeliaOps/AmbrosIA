import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/layout/page-header"
import { InventoryClient, type InventoryItem, type IngredientOption } from "./_components/inventory-client"

export const metadata: Metadata = { title: "Inventario" }

export default async function InventarioPage() {
  const supabase = await createClient()

  const [{ data: rawItems }, { data: ingredients }] = await Promise.all([
    supabase
      .from("inventory_items")
      .select("id, quantity, min_quantity, notes, updated_at, ingredients(id, name, unit, category, current_price)")
      .order("updated_at", { ascending: false }),
    supabase
      .from("ingredients")
      .select("id, name, unit, category, current_price")
      .order("name"),
  ])

  const items = (rawItems ?? []) as unknown as InventoryItem[]

  return (
    <div className="space-y-6">
      <PageHeader title="Inventario" description="Control de existencias de insumos en almacén." />
      <InventoryClient items={items} ingredients={(ingredients ?? []) as IngredientOption[]} />
    </div>
  )
}
