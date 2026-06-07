"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const schema = z.object({
  concept: z.string().min(1, "Indica el concepto (gas, luz, renta, etc.)"),
  amount: z.number().min(0, "El monto debe ser positivo"),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Mes inválido"),
  notes: z.string().optional(),
})
export type OverheadFormData = z.infer<typeof schema>

async function getOrgId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", user.id).single()
  return profile?.org_id ?? null
}

export async function createOverhead(data: OverheadFormData) {
  const parsed = schema.safeParse(data)
  if (!parsed.success) return { data: null, error: "Datos inválidos" }

  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { data: null, error: "No autenticado" }

  const { data: row, error } = await supabase
    .from("overhead_expenses")
    .insert({ org_id: orgId, concept: parsed.data.concept, amount: parsed.data.amount, period: `${parsed.data.month}-01`, notes: parsed.data.notes || null })
    .select("id, concept, amount, period")
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath("/catalogos/costos-indirectos")
  revalidatePath("/utilidad")
  return { data: row, error: null }
}

export async function updateOverhead(id: string, data: OverheadFormData) {
  const parsed = schema.safeParse(data)
  if (!parsed.success) return { data: null, error: "Datos inválidos" }

  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { data: null, error: "No autenticado" }

  const { data: row, error } = await supabase
    .from("overhead_expenses")
    .update({ concept: parsed.data.concept, amount: parsed.data.amount, period: `${parsed.data.month}-01`, notes: parsed.data.notes || null })
    .eq("id", id)
    .eq("org_id", orgId)
    .select("id, concept, amount, period")
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath("/catalogos/costos-indirectos")
  revalidatePath("/utilidad")
  return { data: row, error: null }
}

export async function deleteOverhead(id: string) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { error: "No autenticado" }

  const { error } = await supabase.from("overhead_expenses").delete().eq("id", id).eq("org_id", orgId)
  if (error) return { error: error.message }
  revalidatePath("/catalogos/costos-indirectos")
  revalidatePath("/utilidad")
  return { error: null }
}
