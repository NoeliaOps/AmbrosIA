import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/layout/page-header"
import { IngredientClient } from "./_components/ingredient-client"

export const metadata: Metadata = { title: "Ingredientes" }

export default async function IngredientesPage() {
  const supabase = await createClient()

  const [{ data: ingredients }, { data: suppliers }] = await Promise.all([
    supabase
      .from("ingredients")
      .select("id, name, unit, category, current_price, preferred_supplier_id, notes, updated_at, suppliers(name), ingredient_purchase_units(id, unit, factor, price, supplier_id, is_default, whole_units)")
      .order("name"),
    supabase
      .from("suppliers")
      .select("id, name")
      .eq("is_active", true)
      .order("name"),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ingredientes"
        description="Catálogo de insumos con precios actuales y proveedor preferido."
      />
      <IngredientClient
        ingredients={(ingredients ?? []) as Parameters<typeof IngredientClient>[0]["ingredients"]}
        suppliers={suppliers ?? []}
      />
    </div>
  )
}
