"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const lineItemSchema = z.object({
  type: z.string().default("other"),
  reference_id: z.string().optional(),
  description: z.string().min(1),
  unit_cost: z.number().min(0),
  quantity: z.number().positive(),
  sort_order: z.number().default(0),
})

const quoteSchema = z.object({
  discount_amount: z.number().min(0).default(0),
  margin_percent: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  items: z.array(lineItemSchema),
})

export type LineItemData = z.infer<typeof lineItemSchema>
export type QuoteFormData = z.infer<typeof quoteSchema>

async function getOrgId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", user.id).single()
  return profile?.org_id ?? null
}

export async function upsertQuote(eventId: string, data: QuoteFormData) {
  const parsed = quoteSchema.safeParse(data)
  if (!parsed.success) return { data: null, error: "Datos inválidos" }

  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { data: null, error: "No autenticado" }

  // Verify event belongs to this org
  const { data: event } = await supabase.from("events").select("id").eq("id", eventId).eq("org_id", orgId).maybeSingle()
  if (!event) return { data: null, error: "Evento no encontrado" }

  const { data: existing } = await supabase
    .from("quotes")
    .select("id, version_number, status")
    .eq("event_id", eventId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle()

  const subtotal = parsed.data.items.reduce((s, i) => s + i.unit_cost * i.quantity, 0)
  const total = Math.max(0, subtotal - (parsed.data.discount_amount ?? 0))

  let quoteId: string

  if (existing) {
    // If already approved, block overwrite — caller must change status first
    if (existing.status === "aprobada") {
      return { data: null, error: "No se puede editar una cotización aprobada. Cámbiala a borrador primero." }
    }
    quoteId = existing.id
    const { error } = await supabase.from("quotes").update({
      subtotal,
      discount_amount: parsed.data.discount_amount ?? 0,
      total,
      margin_percent: parsed.data.margin_percent ?? null,
      notes: parsed.data.notes ?? null,
    }).eq("id", quoteId)
    if (error) return { data: null, error: error.message }
  } else {
    // No existing quote — create v1
    const { data: newQuote, error } = await supabase.from("quotes").insert({
      event_id: eventId,
      version_number: 1,
      status: "borrador",
      subtotal,
      discount_amount: parsed.data.discount_amount ?? 0,
      total,
      margin_percent: parsed.data.margin_percent ?? null,
      notes: parsed.data.notes ?? null,
    }).select().single()
    if (error) return { data: null, error: error.message }
    quoteId = newQuote.id
  }

  // Replace line items
  await supabase.from("quote_line_items").delete().eq("quote_id", quoteId)
  if (parsed.data.items.length > 0) {
    const { error } = await supabase.from("quote_line_items").insert(
      parsed.data.items.map((item) => ({
        quote_id: quoteId,
        type: item.type,
        reference_id: item.reference_id ?? null,
        description: item.description,
        unit_cost: item.unit_cost,
        quantity: item.quantity,
        total_cost: item.unit_cost * item.quantity,
        sort_order: item.sort_order,
      }))
    )
    if (error) return { data: null, error: error.message }
  }

  revalidatePath(`/eventos/${eventId}`)
  revalidatePath("/cotizaciones")
  return { data: { id: quoteId }, error: null }
}

export async function updateQuoteStatus(quoteId: string, eventId: string, status: string) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { error: "No autenticado" }

  // Verify quote belongs to this org via event
  const { data: quote } = await supabase
    .from("quotes")
    .select("id, version_number, status, events!inner(org_id)")
    .eq("id", quoteId)
    .maybeSingle()

  const quoteEvent = quote?.events as { org_id: string } | null
  if (!quote || quoteEvent?.org_id !== orgId) return { error: "Cotización no encontrada" }

  // When reverting an approved quote to borrador, create a new version
  // so the approved version is preserved as historical record
  if (quote.status === "aprobada" && status === "borrador") {
    const { data: lineItems } = await supabase
      .from("quote_line_items")
      .select("*")
      .eq("quote_id", quoteId)

    const { data: currentQuoteData } = await supabase
      .from("quotes")
      .select("subtotal, discount_amount, total, margin_percent, notes")
      .eq("id", quoteId)
      .single()

    if (!currentQuoteData) return { error: "Error al leer cotización" }

    const { data: newQuote, error: insertError } = await supabase
      .from("quotes")
      .insert({
        event_id: eventId,
        version_number: (quote.version_number ?? 1) + 1,
        status: "borrador",
        subtotal: currentQuoteData.subtotal,
        discount_amount: currentQuoteData.discount_amount,
        total: currentQuoteData.total,
        margin_percent: currentQuoteData.margin_percent ?? null,
        notes: currentQuoteData.notes ?? null,
      })
      .select()
      .single()

    if (insertError) return { error: insertError.message }

    if (lineItems && lineItems.length > 0) {
      await supabase.from("quote_line_items").insert(
        lineItems.map(({ id: _id, quote_id: _qid, ...li }) => ({ ...li, quote_id: newQuote.id }))
      )
    }

    revalidatePath(`/eventos/${eventId}`)
    revalidatePath("/cotizaciones")
    return { error: null }
  }

  const { error } = await supabase.from("quotes").update({ status }).eq("id", quoteId)
  if (error) return { error: error.message }
  revalidatePath(`/eventos/${eventId}`)
  revalidatePath("/cotizaciones")
  return { error: null }
}

// ── contracts ────────────────────────────────────────────────────────────────

type ContractClause = { id: string; title: string; content: string }

export async function generateContract(eventId: string, quoteId: string) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { data: null, error: "No autenticado" }

  // Verify event belongs to this org
  const { data: event } = await supabase.from("events").select("id").eq("id", eventId).eq("org_id", orgId).maybeSingle()
  if (!event) return { data: null, error: "Evento no encontrado" }

  // Verify the quote is approved before generating a contract
  const { data: quote } = await supabase.from("quotes").select("status").eq("id", quoteId).eq("event_id", eventId).maybeSingle()
  if (!quote) return { data: null, error: "Cotización no encontrada" }
  if (quote.status !== "aprobada") return { data: null, error: "Solo se puede generar un contrato a partir de una cotización aprobada." }

  const { data: existing } = await supabase
    .from("contracts")
    .select("id")
    .eq("event_id", eventId)
    .maybeSingle()

  if (existing) return { data: existing, error: null }

  const defaultClauses: ContractClause[] = [
    { id: "1", title: "Servicios contratados", content: "El prestador se compromete a brindar los servicios de banquetes descritos en la cotización adjunta, en las fechas y lugar acordados." },
    { id: "2", title: "Precio y forma de pago", content: "El monto total acordado se pagará conforme al calendario de pagos establecido. El evento no se confirmará hasta recibir el anticipo correspondiente." },
    { id: "3", title: "Cambios y cancelaciones", content: "Cualquier cambio en el número de invitados deberá notificarse con al menos 72 horas de anticipación. Las cancelaciones con menos de 7 días de anticipación no tendrán derecho a reembolso del anticipo." },
    { id: "4", title: "Responsabilidades", content: "El prestador no se hace responsable por daños causados por terceros ajenos al servicio. El cliente es responsable de obtener los permisos necesarios para el uso del lugar del evento." },
    { id: "5", title: "Vigencia", content: "El presente contrato entra en vigor a partir de la firma de ambas partes y tendrá validez hasta la conclusión satisfactoria del evento." },
  ]

  const { data: contract, error } = await supabase.from("contracts").insert({
    event_id: eventId,
    quote_id: quoteId,
    clauses: defaultClauses,
    status: "borrador",
  }).select().single()

  if (error) return { data: null, error: error.message }
  revalidatePath(`/eventos/${eventId}`)
  revalidatePath("/contratos")
  return { data: contract, error: null }
}

export async function updateContract(id: string, eventId: string, data: {
  clauses?: ContractClause[]
  status?: string
  notes?: string
}) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { error: "No autenticado" }

  // Verify contract belongs to this org via event
  const { data: contract } = await supabase
    .from("contracts")
    .select("id, events!inner(org_id)")
    .eq("id", id)
    .maybeSingle()

  const contractEvent = contract?.events as { org_id: string } | null
  if (!contract || contractEvent?.org_id !== orgId) return { error: "Contrato no encontrado" }

  const { error } = await supabase.from("contracts").update({
    clauses: data.clauses ?? undefined,
    status: data.status ?? undefined,
    notes: data.notes ?? undefined,
    signed_at: data.status === "firmado" ? new Date().toISOString() : undefined,
  }).eq("id", id)
  if (error) return { error: error.message }
  revalidatePath(`/eventos/${eventId}`)
  revalidatePath("/contratos")
  return { error: null }
}
