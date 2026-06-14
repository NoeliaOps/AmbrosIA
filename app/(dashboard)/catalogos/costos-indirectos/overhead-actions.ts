"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { weekStartKey } from "@/lib/utils"
import { z } from "zod"

const schema = z.object({
  concept: z.string().min(1, "Indica el concepto"),
  amount: z.number().min(0, "El monto debe ser positivo"),
  kind: z.enum(["overhead", "service"]),
  period_type: z.enum(["month", "week"]),
  // period_type='month' → "YYYY-MM" · period_type='week' → fecha "YYYY-MM-DD" dentro de la semana
  period_value: z.string().min(1, "Indica el periodo"),
  notes: z.string().optional(),
})
export type OverheadFormData = z.infer<typeof schema>

// Normaliza el valor del formulario a la fecha `period` que se guarda:
// mes → primer día del mes · semana → lunes de la semana.
function resolvePeriod(periodType: "month" | "week", value: string): string | null {
  if (periodType === "week") {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
    return weekStartKey(value)
  }
  if (!/^\d{4}-\d{2}$/.test(value)) return null
  return `${value}-01`
}

async function getOrgId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", user.id).single()
  return profile?.org_id ?? null
}

const SELECT = "id, concept, amount, period, period_type, kind"

export async function createOverhead(data: OverheadFormData) {
  const parsed = schema.safeParse(data)
  if (!parsed.success) return { data: null, error: "Datos inválidos" }
  const period = resolvePeriod(parsed.data.period_type, parsed.data.period_value)
  if (!period) return { data: null, error: "Periodo inválido" }

  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { data: null, error: "No autenticado" }

  const { data: row, error } = await supabase
    .from("overhead_expenses")
    .insert({
      org_id: orgId, concept: parsed.data.concept, amount: parsed.data.amount,
      period, period_type: parsed.data.period_type, kind: parsed.data.kind,
      notes: parsed.data.notes || null,
    })
    .select(SELECT)
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath("/catalogos/costos-indirectos")
  revalidatePath("/utilidad")
  return { data: row, error: null }
}

export async function updateOverhead(id: string, data: OverheadFormData) {
  const parsed = schema.safeParse(data)
  if (!parsed.success) return { data: null, error: "Datos inválidos" }
  const period = resolvePeriod(parsed.data.period_type, parsed.data.period_value)
  if (!period) return { data: null, error: "Periodo inválido" }

  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { data: null, error: "No autenticado" }

  const { data: row, error } = await supabase
    .from("overhead_expenses")
    .update({
      concept: parsed.data.concept, amount: parsed.data.amount,
      period, period_type: parsed.data.period_type, kind: parsed.data.kind,
      notes: parsed.data.notes || null,
    })
    .eq("id", id)
    .eq("org_id", orgId)
    .select(SELECT)
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
