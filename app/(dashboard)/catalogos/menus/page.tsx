import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/layout/page-header"
import { MenuClient } from "./_components/menu-client"

export const metadata: Metadata = { title: "Menús" }

export default async function MenusPage() {
  const supabase = await createClient()

  const [{ data: menus }, { data: dishes }] = await Promise.all([
    supabase
      .from("menus")
      .select("id, name, event_type, notes, menu_dishes(id, dish_id, servings, notes, dishes(name, category, servings_yield, recipe_items(quantity, ingredients(current_price))))")
      .order("name"),
    supabase
      .from("dishes")
      .select("id, name, category, servings_yield, recipe_items(quantity, ingredients(current_price))")
      .order("name"),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Menús"
        description="Combinaciones de platillos para distintos tipos de eventos."
      />
      <MenuClient
        menus={(menus ?? []) as Parameters<typeof MenuClient>[0]["menus"]}
        dishes={(dishes ?? []) as Parameters<typeof MenuClient>[0]["dishes"]}
      />
    </div>
  )
}
