import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/layout/page-header"
import { SupplierClient } from "./_components/supplier-client"

export const metadata: Metadata = { title: "Proveedores" }

export default async function ProveedoresPage() {
  const supabase = await createClient()
  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("id, name, contact_name, phone, email, category, notes, is_active")
    .eq("is_active", true)
    .order("name")

  return (
    <div className="space-y-6">
      <PageHeader
        title="Proveedores"
        description="Directorio de proveedores de insumos y servicios."
      />
      <SupplierClient suppliers={suppliers ?? []} />
    </div>
  )
}
