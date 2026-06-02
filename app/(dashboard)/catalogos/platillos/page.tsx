import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/layout/page-header"
import { DishClient } from "./_components/dish-client"

export const metadata: Metadata = { title: "Platillos" }

export default async function PlatillosPage() {
  const supabase = await createClient()

  const [{ data: dishes }, { data: ingredients }] = await Promise.all([
    supabase
      .from("dishes")
      .select("id, name, category, servings_yield, notes, recipe_items(id, ingredient_id, quantity, notes, ingredients(name, unit, current_price))")
      .order("name"),
    supabase
      .from("ingredients")
      .select("id, name, unit, current_price")
      .order("name"),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platillos"
        description="Catálogo de platillos con recetas y costo estimado por porción."
      />
      <DishClient
        dishes={(dishes ?? []) as Parameters<typeof DishClient>[0]["dishes"]}
        ingredients={ingredients ?? []}
      />
    </div>
  )
}
