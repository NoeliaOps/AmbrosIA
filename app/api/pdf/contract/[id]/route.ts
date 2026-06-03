import { NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { createClient } from "@/lib/supabase/server"
import { ContractPDF, type ContractClause } from "@/components/pdf/contract-pdf"
import React from "react"
import path from "path"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse("No autorizado", { status: 401 })

  const { data: contract } = await supabase
    .from("contracts")
    .select(`
      id, clauses, notes, created_at, signed_at,
      quotes(total),
      events(name, event_date, guest_count, location, clients(name, phone, email))
    `)
    .eq("id", id)
    .single()

  if (!contract) return new NextResponse("Contrato no encontrado", { status: 404 })

  const ev = contract.events as { name: string; event_date: string; guest_count: number; location: string | null; clients: { name: string; phone: string | null; email: string | null } | null } | null
  const quote = contract.quotes as { total: number } | null

  const { data: org } = await supabase.from("organizations").select("name").single()
  const logoPath = path.join(process.cwd(), "public/brand/logo-artesano-dark.jpg")

  const data = {
    logoPath,
    orgName: org?.name,
    contractNumber: id.slice(-6).toUpperCase(),
    createdAt: contract.created_at,
    signedAt: contract.signed_at,
    eventName: ev?.name ?? "Sin nombre",
    eventDate: ev?.event_date ?? new Date().toISOString(),
    guestCount: ev?.guest_count ?? 0,
    location: ev?.location,
    clientName: ev?.clients?.name ?? "Sin cliente",
    clientPhone: ev?.clients?.phone,
    clientEmail: ev?.clients?.email,
    total: quote?.total ?? 0,
    clauses: (contract.clauses as ContractClause[]) ?? [],
    notes: contract.notes,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(React.createElement(ContractPDF, { data }) as any)

  const filename = `contrato-${(ev?.name ?? id).replace(/[^a-z0-9]/gi, "-").toLowerCase()}.pdf`

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  })
}
