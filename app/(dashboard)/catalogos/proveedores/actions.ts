"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const supplierSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  contact_name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Correo inválido").optional().or(z.literal("")),
  category: z.string().optional(),
  notes: z.string().optional(),
})

export type SupplierFormData = z.infer<typeof supplierSchema>

export async function createSupplier(data: SupplierFormData) {
  const parsed = supplierSchema.safeParse(data)
  if (!parsed.success) return { data: null, error: "Datos inválidos" }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: "No autenticado" }

  const { data: profile } = await supabase
    .from("profiles").select("org_id").eq("id", user.id).single()
  if (!profile) return { data: null, error: "Perfil no encontrado" }

  const { data: supplier, error } = await supabase
    .from("suppliers")
    .insert({ ...parsed.data, org_id: profile.org_id })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath("/catalogos/proveedores")
  return { data: supplier, error: null }
}

export async function updateSupplier(id: string, data: SupplierFormData) {
  const parsed = supplierSchema.safeParse(data)
  if (!parsed.success) return { data: null, error: "Datos inválidos" }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: "No autenticado" }
  const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", user.id).single()
  if (!profile) return { data: null, error: "No autenticado" }

  const { data: supplier, error } = await supabase
    .from("suppliers")
    .update(parsed.data)
    .eq("id", id)
    .eq("org_id", profile.org_id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath("/catalogos/proveedores")
  return { data: supplier, error: null }
}

export async function deleteSupplier(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }
  const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", user.id).single()
  if (!profile) return { error: "No autenticado" }

  const { error } = await supabase.from("suppliers").delete().eq("id", id).eq("org_id", profile.org_id)
  if (error) return { error: error.message }
  revalidatePath("/catalogos/proveedores")
  return { error: null }
}
