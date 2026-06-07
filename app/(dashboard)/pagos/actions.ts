"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

async function getOrgId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", user.id).single()
  return profile?.org_id ?? null
}

export async function markPaymentPaid(
  id: string,
  eventId: string,
  paidAt: string,
  paidAmount: number,
  reference?: string,
  discountAmount = 0
) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { error: "No autenticado" }

  // Precondition: only transition from "pendiente" — prevents double-payment
  const { error } = await supabase
    .from("payment_schedules")
    .update({ status: "pagado", paid_at: paidAt, paid_amount: paidAmount, discount_amount: discountAmount, reference: reference ?? null })
    .eq("id", id)
    .eq("status", "pendiente")

  if (error) return { error: error.message }
  revalidatePath("/pagos")
  revalidatePath(`/eventos/${eventId}`)
  return { error: null }
}

export async function markPaymentPending(id: string, eventId: string) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { error: "No autenticado" }

  const { error } = await supabase
    .from("payment_schedules")
    .update({ status: "pendiente", paid_at: null, paid_amount: null, discount_amount: 0, reference: null })
    .eq("id", id)
    .eq("status", "pagado")

  if (error) return { error: error.message }
  revalidatePath("/pagos")
  revalidatePath(`/eventos/${eventId}`)
  return { error: null }
}
