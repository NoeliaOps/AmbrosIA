import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/layout/page-header"
import { StaffClient } from "./_components/staff-client"

export const metadata: Metadata = { title: "Personal" }

export default async function PersonalPage() {
  const supabase = await createClient()

  const { data: staff } = await supabase
    .from("staff_members")
    .select("id, name, position, rate, rate_type, phone, notes, is_active")
    .order("name")

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personal"
        description="Colaboradores disponibles para tus eventos con sus tarifas."
      />
      <StaffClient staff={staff ?? []} />
    </div>
  )
}
