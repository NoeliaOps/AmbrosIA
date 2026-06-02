"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const indirectCostSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  default_amount: z.number().min(0, "El monto debe ser positivo"),
  allocation_method: z.enum(["fixed", "per_guest", "percentage"]),
  description: z.string().optional(),
  is_active: z.boolean(),
})

export type IndirectCostFormData = z.infer<typeof indirectCostSchema>

async function getOrgId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", user.id).single()
  return profile?.org_id ?? null
}

export async function createIndirectCost(data: IndirectCostFormData) {
  const parsed = indirectCostSchema.safeParse(data)
  if (!parsed.success) return { data: null, error: "Datos inválidos" }

  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { data: null, error: "No autenticado" }

  const { data: cost, error } = await supabase
    .from("indirect_cost_categories")
    .insert({
      name: parsed.data.name,
      default_amount: parsed.data.default_amount,
      allocation_method: parsed.data.allocation_method,
      description: parsed.data.description || null,
      is_active: parsed.data.is_active,
      org_id: orgId,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath("/catalogos/costos-indirectos")
  return { data: cost, error: null }
}

export async function updateIndirectCost(id: string, data: IndirectCostFormData) {
  const parsed = indirectCostSchema.safeParse(data)
  if (!parsed.success) return { data: null, error: "Datos inválidos" }

  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { data: null, error: "No autenticado" }

  const { data: cost, error } = await supabase
    .from("indirect_cost_categories")
    .update({
      name: parsed.data.name,
      default_amount: parsed.data.default_amount,
      allocation_method: parsed.data.allocation_method,
      description: parsed.data.description || null,
      is_active: parsed.data.is_active,
    })
    .eq("id", id)
    .eq("org_id", orgId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath("/catalogos/costos-indirectos")
  return { data: cost, error: null }
}

export async function deleteIndirectCost(id: string) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { error: "No autenticado" }

  const { error } = await supabase
    .from("indirect_cost_categories")
    .delete()
    .eq("id", id)
    .eq("org_id", orgId)
  if (error) return { error: error.message }
  revalidatePath("/catalogos/costos-indirectos")
  return { error: null }
}
