"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// ⚠️ FIRMA DIGITAL — MODO MOCK (showcase).
// Simula el flujo de un PSC (estilo Mifiel) SIN llamar a ningún proveedor real:
//   borrador → enviado a firma → firmado (+ constancia NOM-151 simulada + auditoría).
// Cuando se integre Mifiel, reemplazar el cuerpo de estas funciones por llamadas a su
// API/SDK y llenar los mismos campos desde su webhook. Ver project-pending (memoria).

type SB = Awaited<ReturnType<typeof createClient>>

async function getOrgId(supabase: SB) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", user.id).single()
  return profile?.org_id ?? null
}

type AuditEntry = { at: string; event: string }

function hex(n: number) {
  return crypto.randomUUID().replace(/-/g, "").slice(0, n).toUpperCase()
}

function nom151Folio() {
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  return `NOM151-${d}-${hex(8)}`
}

// Enviar a firma (mock): registra firmante y marca el contrato como "enviado".
export async function sendForSignature(contractId: string, eventId: string, data: { signerName: string; signerEmail?: string }) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { data: null, error: "No autenticado" }
  if (!data.signerName.trim()) return { data: null, error: "Indica el nombre del firmante" }

  const { data: existing, error: fetchErr } = await supabase
    .from("contracts")
    .select("status")
    .eq("id", contractId)
    .eq("event_id", eventId)
    .single()
  if (fetchErr || !existing) return { data: null, error: "Contrato no encontrado" }
  if (existing.status !== "borrador") return { data: null, error: "Solo se puede enviar a firma un contrato en borrador" }

  const now = new Date().toISOString()
  const audit: AuditEntry[] = [{ at: now, event: `Documento enviado a firma a ${data.signerName.trim()}` }]

  const { data: row, error } = await supabase
    .from("contracts")
    .update({
      status: "enviado",
      signature_provider: "mock",
      signer_name: data.signerName.trim(),
      signer_email: data.signerEmail?.trim() || null,
      signature_audit: audit,
      signed_at: null,
      nom151_folio: null,
      signature_hash: null,
    })
    .eq("id", contractId)
    .eq("event_id", eventId)
    .select("*")
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath(`/eventos/${eventId}`)
  return { data: row, error: null }
}

// Firmar (mock): simula la firma del cliente + emite constancia NOM-151 simulada.
export async function signContractMock(contractId: string, eventId: string) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { data: null, error: "No autenticado" }

  const { data: current } = await supabase.from("contracts").select("signature_audit, signer_name, status").eq("id", contractId).eq("event_id", eventId).maybeSingle()
  if (!current || current.status !== "enviado") return { data: null, error: "El contrato no está pendiente de firma" }
  const prev = (current?.signature_audit ?? []) as AuditEntry[]
  const signer = current?.signer_name ?? "el cliente"

  const t0 = Date.now()
  const stamp = (offsetSec: number) => new Date(t0 + offsetSec * 1000).toISOString()
  const folio = nom151Folio()
  const hash = `sha256:${hex(16)}${hex(16)}`.toLowerCase()
  const audit: AuditEntry[] = [
    ...prev,
    { at: stamp(0), event: `Documento abierto por ${signer}` },
    { at: stamp(1), event: `Firmado por ${signer}` },
    { at: stamp(2), event: `Constancia de conservación NOM-151 emitida (${folio})` },
  ]

  const { data: row, error } = await supabase
    .from("contracts")
    .update({
      status: "firmado",
      signature_provider: "mock",
      signed_at: stamp(1),
      nom151_folio: folio,
      signature_hash: hash,
      signature_audit: audit,
    })
    .eq("id", contractId)
    .eq("event_id", eventId)
    .select("*")
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath(`/eventos/${eventId}`)
  revalidatePath("/contratos")
  return { data: row, error: null }
}

// Reiniciar firma (para volver a demostrar el flujo).
export async function resetSignature(contractId: string, eventId: string) {
  const supabase = await createClient()
  const orgId = await getOrgId(supabase)
  if (!orgId) return { data: null, error: "No autenticado" }

  const { data: row, error } = await supabase
    .from("contracts")
    .update({
      status: "borrador",
      signed_at: null,
      nom151_folio: null,
      signature_hash: null,
      signer_name: null,
      signer_email: null,
      signature_audit: [],
    })
    .eq("id", contractId)
    .eq("event_id", eventId)
    .select("*")
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath(`/eventos/${eventId}`)
  return { data: row, error: null }
}
