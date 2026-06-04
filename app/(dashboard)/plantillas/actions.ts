"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const itemSchema = z.object({
  description: z.string().min(1, "Describe el concepto"),
  quantity: z.number().min(0),
  unit_cost: z.number().min(0),
})

const schema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  event_type: z.string().optional(),
  description: z.string().optional(),
  price_per_guest: z.number().min(0, "El precio debe ser positivo"),
  is_active: z.boolean(),
  items: z.array(itemSchema),
})
export type TemplateFormData = z.infer<typeof schema>

async function getOrgId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", user.id).single()
  return profile?.org_id ?? null
}

function itemRows(templateId: string, items: TemplateFormData["items"]) {
  return items.map((it, i) => ({ ...it, template_id: templateId, sort_order: i }))
}

export async function createTemplate(data: TemplateFormData) {
  const parsed = schema.safeParse(data)
  if (!parsed.success) return { data: null, error: "Datos inválidos" }

  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { data: null, error: "No autenticado" }

  const { data: tpl, error } = await supabase
    .from("quote_templates")
    .insert({
      name: parsed.data.name,
      event_type: parsed.data.event_type,
      description: parsed.data.description,
      price_per_guest: parsed.data.price_per_guest,
      is_active: parsed.data.is_active,
      org_id: orgId,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  if (parsed.data.items.length > 0) {
    const { error: itemsError } = await supabase.from("quote_template_items").insert(itemRows(tpl.id, parsed.data.items))
    if (itemsError) return { data: null, error: itemsError.message }
  }

  revalidatePath("/plantillas")
  return { data: tpl, error: null }
}

export async function updateTemplate(id: string, data: TemplateFormData) {
  const parsed = schema.safeParse(data)
  if (!parsed.success) return { data: null, error: "Datos inválidos" }

  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { data: null, error: "No autenticado" }

  const { data: tpl, error } = await supabase
    .from("quote_templates")
    .update({
      name: parsed.data.name,
      event_type: parsed.data.event_type,
      description: parsed.data.description,
      price_per_guest: parsed.data.price_per_guest,
      is_active: parsed.data.is_active,
    })
    .eq("id", id)
    .eq("org_id", orgId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  // Reemplaza los items
  await supabase.from("quote_template_items").delete().eq("template_id", id)
  if (parsed.data.items.length > 0) {
    await supabase.from("quote_template_items").insert(itemRows(id, parsed.data.items))
  }

  revalidatePath("/plantillas")
  return { data: tpl, error: null }
}

export async function deleteTemplate(id: string) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { error: "No autenticado" }

  const { error } = await supabase.from("quote_templates").delete().eq("id", id).eq("org_id", orgId)
  if (error) return { error: error.message }
  revalidatePath("/plantillas")
  return { error: null }
}
