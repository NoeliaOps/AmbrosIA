"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const assignmentSchema = z.object({
  staff_member_id: z.string().uuid("Colaborador requerido"),
  role: z.string().optional(),
  call_time: z.string().optional(),
  estimated_hours: z.number().min(0.5).max(24),
  notes: z.string().optional(),
})

export type AssignmentFormData = z.infer<typeof assignmentSchema>

async function getOrgId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", user.id).single()
  return profile?.org_id ?? null
}

function computeCost(rate: number, rateType: string, estimatedHours: number): number {
  if (rateType === "hourly") return Math.round(rate * estimatedHours * 100) / 100
  if (rateType === "event") return rate
  // daily
  return rate
}

export async function createAssignment(eventId: string, data: AssignmentFormData) {
  const parsed = assignmentSchema.safeParse(data)
  if (!parsed.success) return { data: null, error: "Datos inválidos" }

  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { data: null, error: "No autenticado" }

  const { data: member, error: memberError } = await supabase
    .from("staff_members")
    .select("rate, rate_type")
    .eq("id", parsed.data.staff_member_id)
    .eq("org_id", orgId)
    .single()

  if (memberError || !member) return { data: null, error: "Colaborador no encontrado" }

  const computed_cost = computeCost(member.rate, member.rate_type, parsed.data.estimated_hours)

  const { data: assignment, error } = await supabase
    .from("event_staff_assignments")
    .insert({
      org_id: orgId,
      event_id: eventId,
      staff_member_id: parsed.data.staff_member_id,
      role: parsed.data.role || null,
      call_time: parsed.data.call_time || null,
      estimated_hours: parsed.data.estimated_hours,
      computed_cost,
      notes: parsed.data.notes || null,
    })
    .select("*, staff_members(id, name, position, rate, rate_type, phone)")
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath(`/eventos/${eventId}`)
  revalidatePath("/utilidad")
  revalidatePath("/personal-eventos")
  return { data: assignment, error: null }
}

export async function updateAssignment(id: string, eventId: string, data: AssignmentFormData) {
  const parsed = assignmentSchema.safeParse(data)
  if (!parsed.success) return { data: null, error: "Datos inválidos" }

  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { data: null, error: "No autenticado" }

  const { data: member, error: memberError } = await supabase
    .from("staff_members")
    .select("rate, rate_type")
    .eq("id", parsed.data.staff_member_id)
    .eq("org_id", orgId)
    .single()

  if (memberError || !member) return { data: null, error: "Colaborador no encontrado" }

  const computed_cost = computeCost(member.rate, member.rate_type, parsed.data.estimated_hours)

  const { data: assignment, error } = await supabase
    .from("event_staff_assignments")
    .update({
      role: parsed.data.role || null,
      call_time: parsed.data.call_time || null,
      estimated_hours: parsed.data.estimated_hours,
      computed_cost,
      notes: parsed.data.notes || null,
    })
    .eq("id", id)
    .select("*, staff_members(id, name, position, rate, rate_type, phone)")
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath(`/eventos/${eventId}`)
  revalidatePath("/utilidad")
  revalidatePath("/personal-eventos")
  return { data: assignment, error: null }
}

export async function deleteAssignment(id: string, eventId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("event_staff_assignments").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidatePath(`/eventos/${eventId}`)
  revalidatePath("/utilidad")
  revalidatePath("/personal-eventos")
  return { error: null }
}

export async function checkConflicts(staffMemberId: string, eventId: string, eventDate: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("event_staff_assignments")
    .select("id, events(id, name, event_date)")
    .eq("staff_member_id", staffMemberId)
    .neq("event_id", eventId)

  type AssignmentRow = { id: string; events: { id: string; name: string; event_date: string } | null }
  const rows = (data as unknown as AssignmentRow[]) ?? []

  return rows.filter((r) => r.events?.event_date === eventDate).map((r) => r.events!)
}
