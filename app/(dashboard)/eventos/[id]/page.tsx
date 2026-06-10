import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { EventDetail } from "./_components/event-detail"

type TabKey = "resumen" | "menu" | "cotizacion" | "contrato" | "pagos" | "comisiones" | "degustaciones" | "requisicion" | "compras" | "personal"
const VALID_TABS: TabKey[] = ["resumen", "menu", "cotizacion", "contrato", "pagos", "comisiones", "degustaciones", "requisicion", "compras", "personal"]

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from("events").select("name").eq("id", id).single()
  return { title: data?.name ?? "Evento" }
}

export default async function EventDetailPage({ params, searchParams }: Props) {
  const { id } = await params
  const { tab } = await searchParams
  const initialTab: TabKey = VALID_TABS.includes(tab as TabKey) ? (tab as TabKey) : "resumen"

  const supabase = await createClient()

  const [
    { data: event },
    { data: quote },
    { data: contract },
    { data: dishes },
    { data: clients },
    { data: payments },
    { data: requisition },
    { data: purchaseOrders },
    { data: actualPurchases },
    { data: indirectCosts },
    { data: indirectCostCategories },
    { data: staffAssignments },
    { data: staffMembers },
    { data: commissions },
    { data: tastings },
    { data: eventDishes },
    { data: menuTemplates },
  ] = await Promise.all([
    supabase
      .from("events")
      .select("*, clients(id, name, phone, email)")
      .eq("id", id)
      .single(),
    supabase
      .from("quotes")
      .select("*, quote_line_items(*)")
      .eq("event_id", id)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("contracts")
      .select("*")
      .eq("event_id", id)
      .maybeSingle(),
    supabase
      .from("dishes")
      .select("id, name, category, servings_yield, recipe_items(quantity, ingredients(current_price))")
      .order("name"),
    supabase
      .from("clients")
      .select("id, name, phone, email")
      .order("name"),
    supabase
      .from("payment_schedules")
      .select("*")
      .eq("event_id", id)
      .order("sort_order")
      .order("due_date"),
    supabase
      .from("requisitions")
      .select("*, requisition_items(*, ingredients(id, name, unit, current_price, preferred_supplier_id))")
      .eq("event_id", id)
      .maybeSingle(),
    supabase
      .from("purchase_orders")
      .select("*, suppliers(name, email, phone), purchase_order_items(*, ingredients(name, unit))")
      .eq("event_id", id)
      .order("created_at"),
    supabase
      .from("actual_purchases")
      .select("*, ingredients(name, unit)")
      .eq("event_id", id)
      .order("purchased_at"),
    supabase
      .from("event_indirect_costs")
      .select("*, indirect_cost_categories(id, name, allocation_method, default_amount)")
      .eq("event_id", id),
    supabase
      .from("indirect_cost_categories")
      .select("id, name, allocation_method, default_amount")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("event_staff_assignments")
      .select("*, staff_members(id, name, position, rate, rate_type, phone)")
      .eq("event_id", id)
      .order("created_at"),
    supabase
      .from("staff_members")
      .select("id, name, position, rate, rate_type, phone")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("event_commissions")
      .select("id, beneficiary, role, basis, percentage, amount, status, paid_at, notes")
      .eq("event_id", id)
      .order("created_at"),
    supabase
      .from("event_tastings")
      .select("id, tasting_date, attendees, cost, status, notes")
      .eq("event_id", id)
      .order("tasting_date"),
    supabase
      .from("event_dishes")
      .select("id, dish_id, servings, sort_order")
      .eq("event_id", id)
      .order("sort_order"),
    supabase
      .from("menus")
      .select("id, name")
      .order("name"),
  ])

  if (!event) notFound()

  return (
    <EventDetail
      event={event as Parameters<typeof EventDetail>[0]["event"]}
      quote={quote as Parameters<typeof EventDetail>[0]["quote"]}
      contract={contract as Parameters<typeof EventDetail>[0]["contract"]}
      dishes={(dishes ?? []) as Parameters<typeof EventDetail>[0]["dishes"]}
      clients={clients ?? []}
      payments={(payments ?? []) as Parameters<typeof EventDetail>[0]["payments"]}
      requisition={requisition as Parameters<typeof EventDetail>[0]["requisition"]}
      purchaseOrders={(purchaseOrders ?? []) as Parameters<typeof EventDetail>[0]["purchaseOrders"]}
      actualPurchases={(actualPurchases ?? []) as Parameters<typeof EventDetail>[0]["actualPurchases"]}
      indirectCosts={(indirectCosts ?? []) as Parameters<typeof EventDetail>[0]["indirectCosts"]}
      indirectCostCategories={(indirectCostCategories ?? []) as Parameters<typeof EventDetail>[0]["indirectCostCategories"]}
      staffAssignments={(staffAssignments ?? []) as Parameters<typeof EventDetail>[0]["staffAssignments"]}
      staffMembers={(staffMembers ?? []) as Parameters<typeof EventDetail>[0]["staffMembers"]}
      commissions={(commissions ?? []) as Parameters<typeof EventDetail>[0]["commissions"]}
      tastings={(tastings ?? []) as Parameters<typeof EventDetail>[0]["tastings"]}
      eventDishes={(eventDishes ?? []) as Parameters<typeof EventDetail>[0]["eventDishes"]}
      menuTemplates={(menuTemplates ?? []) as Parameters<typeof EventDetail>[0]["menuTemplates"]}
      initialTab={initialTab}
    />
  )
}
