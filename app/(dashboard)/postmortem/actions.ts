"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const schema = z.object({
  event_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5).nullable(),
  went_well: z.string().optional(),
  to_improve: z.string().optional(),
  lessons: z.string().optional(),
})
export type PostmortemFormData = z.infer<typeof schema>

async function getOrgId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", user.id).single()
  return profile?.org_id ?? null
}

export async function savePostmortem(data: PostmortemFormData) {
  const parsed = schema.safeParse(data)
  if (!parsed.success) return { data: null, error: "Datos inválidos" }

  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { data: null, error: "No autenticado" }

  const fields = {
    rating: parsed.data.rating,
    went_well: parsed.data.went_well || null,
    to_improve: parsed.data.to_improve || null,
    lessons: parsed.data.lessons || null,
  }

  const { data: existing } = await supabase
    .from("event_postmortems")
    .select("id").eq("event_id", parsed.data.event_id).eq("org_id", orgId).maybeSingle()

  let result
  if (existing) {
    result = await supabase.from("event_postmortems").update(fields).eq("id", existing.id).eq("org_id", orgId).select().single()
  } else {
    result = await supabase.from("event_postmortems").insert({ event_id: parsed.data.event_id, org_id: orgId, ...fields }).select().single()
  }

  if (result.error) return { data: null, error: result.error.message }
  revalidatePath("/postmortem")
  return { data: result.data, error: null }
}

export async function deletePostmortem(id: string) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { error: "No autenticado" }

  const { error } = await supabase.from("event_postmortems").delete().eq("id", id).eq("org_id", orgId)
  if (error) return { error: error.message }
  revalidatePath("/postmortem")
  return { error: null }
}
