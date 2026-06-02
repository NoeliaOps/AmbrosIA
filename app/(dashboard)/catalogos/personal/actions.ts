"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const staffSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  position: z.string().min(1, "El puesto es requerido"),
  rate: z.number().min(0, "La tarifa debe ser positiva"),
  rate_type: z.enum(["hourly", "daily", "event"]),
  phone: z.string().optional(),
  notes: z.string().optional(),
  is_active: z.boolean(),
})

export type StaffFormData = z.infer<typeof staffSchema>

async function getOrgId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", user.id).single()
  return profile?.org_id ?? null
}

export async function createStaff(data: StaffFormData) {
  const parsed = staffSchema.safeParse(data)
  if (!parsed.success) return { data: null, error: "Datos inválidos" }

  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { data: null, error: "No autenticado" }

  const { data: staff, error } = await supabase
    .from("staff_members")
    .insert({
      name: parsed.data.name,
      position: parsed.data.position,
      rate: parsed.data.rate,
      rate_type: parsed.data.rate_type,
      phone: parsed.data.phone || null,
      notes: parsed.data.notes || null,
      is_active: parsed.data.is_active,
      org_id: orgId,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath("/catalogos/personal")
  return { data: staff, error: null }
}

export async function updateStaff(id: string, data: StaffFormData) {
  const parsed = staffSchema.safeParse(data)
  if (!parsed.success) return { data: null, error: "Datos inválidos" }

  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { data: null, error: "No autenticado" }

  const { data: staff, error } = await supabase
    .from("staff_members")
    .update({
      name: parsed.data.name,
      position: parsed.data.position,
      rate: parsed.data.rate,
      rate_type: parsed.data.rate_type,
      phone: parsed.data.phone || null,
      notes: parsed.data.notes || null,
      is_active: parsed.data.is_active,
    })
    .eq("id", id)
    .eq("org_id", orgId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath("/catalogos/personal")
  return { data: staff, error: null }
}

export async function deleteStaff(id: string) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { error: "No autenticado" }

  const { error } = await supabase.from("staff_members").delete().eq("id", id).eq("org_id", orgId)
  if (error) return { error: error.message }
  revalidatePath("/catalogos/personal")
  return { error: null }
}
