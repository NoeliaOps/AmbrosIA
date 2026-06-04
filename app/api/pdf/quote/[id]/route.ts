import { NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { createClient } from "@/lib/supabase/server"
import { QuotePDF } from "@/components/pdf/quote-pdf"
import { loadOrgLogo } from "@/lib/pdf-fonts"
import React from "react"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse("No autorizado", { status: 401 })

  const { data: quote } = await supabase
    .from("quotes")
    .select(`
      id, version_number, subtotal, discount_amount, total, margin_percent, notes, created_at,
      quote_line_items(description, quantity, unit_cost, total_cost, sort_order),
      events(name, event_date, guest_count, clients(name, phone, email))
    `)
    .eq("id", id)
    .single()

  if (!quote) return new NextResponse("Cotización no encontrada", { status: 404 })

  const ev = quote.events as { name: string; event_date: string; guest_count: number; clients: { name: string; phone: string | null; email: string | null } | null } | null
  const items = [...(quote.quote_line_items ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

  const { data: org } = await supabase.from("organizations").select("name").single()

  const data = {
    logo: loadOrgLogo(),
    orgName: org?.name,
    quoteNumber: `${String(quote.version_number ?? 1).padStart(3, "0")}`,
    createdAt: quote.created_at,
    eventName: ev?.name ?? "Sin nombre",
    eventDate: ev?.event_date ?? new Date().toISOString(),
    guestCount: ev?.guest_count ?? 0,
    clientName: ev?.clients?.name ?? "Sin cliente",
    clientPhone: ev?.clients?.phone,
    clientEmail: ev?.clients?.email,
    items: items.map((li) => ({
      description: li.description,
      quantity: li.quantity,
      unit_cost: li.unit_cost,
      total_cost: li.total_cost,
    })),
    subtotal: quote.subtotal,
    discountAmount: quote.discount_amount,
    total: quote.total,
    marginPercent: quote.margin_percent,
    notes: quote.notes,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(React.createElement(QuotePDF, { data }) as any)

  const filename = `cotizacion-${(ev?.name ?? id).replace(/[^a-z0-9]/gi, "-").toLowerCase()}.pdf`

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  })
}
