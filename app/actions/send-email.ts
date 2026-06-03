"use server"

import { Resend } from "resend"
import { createClient } from "@/lib/supabase/server"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM   = process.env.EMAIL_FROM ?? "noreply@ambrosia-eta.vercel.app"

function fmt(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n)
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })
}

// ── Send quote PDF to client ────────────────────────────────────────────────

export async function sendQuoteEmail(quoteId: string): Promise<{ error: string | null }> {
  if (!process.env.RESEND_API_KEY) return { error: "Resend no está configurado." }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const [{ data: quote }, { data: org }] = await Promise.all([
    supabase
      .from("quotes")
      .select(`
        id, version_number, total, subtotal, discount_amount, notes, created_at,
        events(name, event_date, guest_count, clients(name, email))
      `)
      .eq("id", quoteId)
      .single(),
    supabase.from("organizations").select("name").single(),
  ])

  if (!quote) return { error: "Cotización no encontrada" }

  const ev     = quote.events as { name: string; event_date: string; guest_count: number; clients: { name: string; email: string | null } | null } | null
  const client = ev?.clients
  if (!client?.email) return { error: "El cliente no tiene correo electrónico registrado." }

  const orgName = org?.name ?? "Servicios de banquetes"
  const pdfUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://ambrosia-eta.vercel.app"}/api/pdf/quote/${quoteId}`

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F3F0E9;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F0E9;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:6px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr><td style="background:#0F0F0F;padding:24px 32px;">
          <p style="margin:0;font-family:Georgia,serif;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">${orgName}</p>
        </td></tr>
        <!-- Gold line -->
        <tr><td style="height:3px;background:#C6A56B;"></td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:13px;color:#6B6660;">Estimado/a,</p>
          <p style="margin:0 0 24px;font-family:Georgia,serif;font-size:18px;font-weight:700;color:#0F0F0F;">${client.name}</p>

          <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:13px;color:#3C3C3C;line-height:1.6;">
            Con gusto le compartimos la cotización para el evento <strong>${ev?.name ?? ""}</strong>
            programado el <strong>${ev ? fmtDate(ev.event_date) : ""}</strong> para
            <strong>${ev?.guest_count ?? 0} invitados</strong>.
          </p>

          <!-- Event box -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F0E9;border-radius:4px;margin-bottom:24px;">
            <tr>
              <td style="padding:16px 20px;">
                <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:10px;color:#6B6660;letter-spacing:1.5px;text-transform:uppercase;">Total de la cotización</p>
                <p style="margin:0;font-family:Georgia,serif;font-size:28px;font-weight:700;color:#0F0F0F;">${fmt(quote.total)}</p>
                ${quote.discount_amount > 0 ? `<p style="margin:4px 0 0;font-family:Arial,sans-serif;font-size:11px;color:#6B6660;">Subtotal ${fmt(quote.subtotal)} · Descuento -${fmt(quote.discount_amount)}</p>` : ""}
              </td>
            </tr>
          </table>

          <!-- CTA button -->
          <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td style="background:#0F0F0F;border-radius:4px;">
                <a href="${pdfUrl}" style="display:inline-block;padding:12px 28px;font-family:Arial,sans-serif;font-size:13px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.5px;">
                  Descargar cotización en PDF →
                </a>
              </td>
            </tr>
          </table>

          ${quote.notes ? `<p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:12px;color:#6B6660;line-height:1.5;border-left:3px solid #C6A56B;padding-left:12px;">${quote.notes}</p>` : ""}

          <p style="margin:24px 0 0;font-family:Arial,sans-serif;font-size:13px;color:#3C3C3C;line-height:1.6;">
            Quedamos a sus órdenes para cualquier ajuste o pregunta.<br>
            Será un placer hacer de su evento una experiencia memorable.
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#F3F0E9;padding:16px 32px;border-top:1px solid #D8D3C8;">
          <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#6B6660;text-align:center;">
            ${orgName} · <span style="color:#C6A56B;">Gastronomía artesanal para eventos memorables</span>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  const { error } = await resend.emails.send({
    from: FROM,
    to:   client.email,
    subject: `Cotización — ${ev?.name ?? "Evento"} | ${orgName}`,
    html,
  })

  if (error) return { error: (error as { message: string }).message }
  return { error: null }
}

// ── Send contract to client for signature ──────────────────────────────────

export async function sendContractEmail(contractId: string): Promise<{ error: string | null }> {
  if (!process.env.RESEND_API_KEY) return { error: "Resend no está configurado." }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const [{ data: contract }, { data: org }] = await Promise.all([
    supabase
      .from("contracts")
      .select(`
        id, created_at,
        quotes(total),
        events(name, event_date, clients(name, email))
      `)
      .eq("id", contractId)
      .single(),
    supabase.from("organizations").select("name").single(),
  ])

  if (!contract) return { error: "Contrato no encontrado" }

  const ev     = contract.events as { name: string; event_date: string; clients: { name: string; email: string | null } | null } | null
  const client = ev?.clients
  if (!client?.email) return { error: "El cliente no tiene correo electrónico registrado." }

  const orgName = org?.name ?? "Servicios de banquetes"
  const pdfUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://ambrosia-eta.vercel.app"}/api/pdf/contract/${contractId}`
  const total  = (contract.quotes as { total: number } | null)?.total ?? 0

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F3F0E9;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F0E9;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:6px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#0F0F0F;padding:24px 32px;">
          <p style="margin:0;font-family:Georgia,serif;font-size:22px;font-weight:700;color:#ffffff;">${orgName}</p>
        </td></tr>
        <tr><td style="height:3px;background:#C6A56B;"></td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:13px;color:#6B6660;">Estimado/a,</p>
          <p style="margin:0 0 24px;font-family:Georgia,serif;font-size:18px;font-weight:700;color:#0F0F0F;">${client.name}</p>

          <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:13px;color:#3C3C3C;line-height:1.6;">
            Adjuntamos el contrato de servicios para el evento <strong>${ev?.name ?? ""}</strong>
            del <strong>${ev ? fmtDate(ev.event_date) : ""}</strong> por un valor de
            <strong>${fmt(total)}</strong>.
          </p>
          <p style="margin:0 0 24px;font-family:Arial,sans-serif;font-size:13px;color:#3C3C3C;line-height:1.6;">
            Favor de revisar el documento y confirmar su aceptación para proceder con la confirmación del evento.
          </p>

          <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td style="background:#0F0F0F;border-radius:4px;">
                <a href="${pdfUrl}" style="display:inline-block;padding:12px 28px;font-family:Arial,sans-serif;font-size:13px;font-weight:600;color:#ffffff;text-decoration:none;">
                  Ver contrato en PDF →
                </a>
              </td>
            </tr>
          </table>

          <p style="margin:24px 0 0;font-family:Arial,sans-serif;font-size:13px;color:#3C3C3C;line-height:1.6;">
            Para firmar el contrato, puede responder a este correo o contactarnos directamente.<br>
            Quedamos a sus órdenes.
          </p>
        </td></tr>
        <tr><td style="background:#F3F0E9;padding:16px 32px;border-top:1px solid #D8D3C8;">
          <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#6B6660;text-align:center;">
            ${orgName} · <span style="color:#C6A56B;">Gastronomía artesanal para eventos memorables</span>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  const { error } = await resend.emails.send({
    from: FROM,
    to:   client.email,
    subject: `Contrato de servicios — ${ev?.name ?? "Evento"} | ${orgName}`,
    html,
  })

  if (error) return { error: (error as { message: string }).message }
  return { error: null }
}
