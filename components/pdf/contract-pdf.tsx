import React from "react"
import { Document, Page, View, Text, StyleSheet, Font, Image as PdfImage } from "@react-pdf/renderer"

Font.register({
  family: "Playfair",
  fonts: [
    { src: "https://fonts.gstatic.com/s/playfairdisplay/v37/nuFiD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKd3vXDXbtXN.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/playfairdisplay/v37/nuFiD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKd3vXDXbtM.ttf", fontWeight: 700 },
  ],
})
Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiJ-Ek-_EeA.woff2", fontWeight: 600 },
  ],
})

const GOLD = "#D4952B"
const INK = "#0F0F0F"
const CHARCOAL = "#3C3C3C"
const CREAM = "#F3F0E9"
const BORDER = "#D8D3C8"
const MUTED = "#6B6660"

const s = StyleSheet.create({
  page: { fontFamily: "Inter", fontSize: 9, color: INK, backgroundColor: "#FFFFFF", paddingTop: 0, paddingBottom: 48, paddingHorizontal: 0 },
  headerBand: { backgroundColor: INK, paddingHorizontal: 36, paddingVertical: 24, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  headerLogo: { fontFamily: "Playfair", fontSize: 22, fontWeight: 700, color: "#FFFFFF" },
  headerSub: { fontFamily: "Inter", fontSize: 7, color: GOLD, letterSpacing: 2, textTransform: "uppercase", marginTop: 3 },
  headerTag: { fontFamily: "Inter", fontSize: 7, color: GOLD, letterSpacing: 2, textTransform: "uppercase", textAlign: "right" },
  headerTagNum: { fontFamily: "Playfair", fontSize: 14, color: "#FFFFFF", textAlign: "right", marginTop: 2 },
  body: { paddingHorizontal: 36, paddingTop: 24 },
  accentLine: { height: 2, backgroundColor: GOLD, marginBottom: 20 },
  // Title section
  contractTitle: { fontFamily: "Playfair", fontSize: 18, fontWeight: 700, color: INK, marginBottom: 4 },
  contractSubtitle: { fontFamily: "Inter", fontSize: 8, color: MUTED, marginBottom: 20 },
  // Parties box
  partiesRow: { flexDirection: "row", gap: 16, marginBottom: 20 },
  partyBox: { flex: 1, backgroundColor: CREAM, borderRadius: 3, padding: 12 },
  partyLabel: { fontFamily: "Inter", fontSize: 6.5, color: MUTED, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 5 },
  partyName: { fontFamily: "Playfair", fontSize: 11, fontWeight: 700, color: INK, marginBottom: 2 },
  partyDetail: { fontFamily: "Inter", fontSize: 8, color: CHARCOAL, lineHeight: 1.4 },
  // Event summary box
  eventBox: { backgroundColor: INK, borderRadius: 3, padding: 12, marginBottom: 20, flexDirection: "row", justifyContent: "space-between" },
  eventLabel: { fontFamily: "Inter", fontSize: 6.5, color: GOLD, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 },
  eventValue: { fontFamily: "Playfair", fontSize: 11, fontWeight: 700, color: "#FFFFFF" },
  eventValueSm: { fontFamily: "Inter", fontSize: 8, color: "rgba(255,255,255,0.6)", marginTop: 2 },
  // Clauses
  clauseSection: { marginBottom: 16 },
  clauseTitle: { fontFamily: "Playfair", fontSize: 10, fontWeight: 700, color: INK, marginBottom: 4, borderBottom: `1pt solid ${BORDER}`, paddingBottom: 3 },
  clauseText: { fontFamily: "Inter", fontSize: 8, color: CHARCOAL, lineHeight: 1.6 },
  // Signatures
  sigsRow: { flexDirection: "row", gap: 24, marginTop: 32 },
  sigBox: { flex: 1, borderTop: `1pt solid ${INK}`, paddingTop: 8 },
  sigLabel: { fontFamily: "Inter", fontSize: 7, color: MUTED },
  sigName: { fontFamily: "Playfair", fontSize: 9, fontWeight: 700, color: INK, marginTop: 4 },
  // Amount badge
  amountBadge: { backgroundColor: GOLD, borderRadius: 3, paddingHorizontal: 10, paddingVertical: 6 },
  amountLabel: { fontFamily: "Inter", fontSize: 6.5, color: INK, letterSpacing: 1, textTransform: "uppercase" },
  amountValue: { fontFamily: "Playfair", fontSize: 14, fontWeight: 700, color: INK, marginTop: 2 },
  // Footer
  footer: { position: "absolute", bottom: 24, left: 36, right: 36, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTop: `0.5pt solid ${BORDER}`, paddingTop: 8 },
  footerText: { fontFamily: "Inter", fontSize: 7, color: MUTED },
  footerGold: { fontFamily: "Inter", fontSize: 7, color: GOLD },
  pageNum: { fontFamily: "Inter", fontSize: 7, color: MUTED },
})

function fmt(amount: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount)
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })
}

export type ContractClause = { id: string; title: string; content: string }

export type ContractPDFData = {
  logoPath?: string
  orgName?: string
  contractNumber: string
  createdAt: string
  signedAt?: string | null
  eventName: string
  eventDate: string
  guestCount: number
  location?: string | null
  clientName: string
  clientPhone?: string | null
  clientEmail?: string | null
  total: number
  clauses: ContractClause[]
  notes?: string | null
}

export function ContractPDF({ data }: { data: ContractPDFData }) {
  const orgName = data.orgName ?? "Banquetes"
  return (
    <Document
      title={`Contrato — ${data.eventName}`}
      author={orgName}
      subject="Contrato de servicios de banquetes"
    >
      <Page size="LETTER" style={s.page}>
        {/* Header band */}
        <View style={s.headerBand}>
          <View>
            {data.logoPath
              ? <PdfImage src={data.logoPath} style={{ height: 28, width: "auto", objectFit: "contain" }} />
              : <Text style={s.headerLogo}>{orgName}</Text>
            }
          </View>
          <View>
            <Text style={s.headerTag}>Contrato de servicios</Text>
            <Text style={s.headerTagNum}>#{data.contractNumber}</Text>
          </View>
        </View>

        <View style={s.body}>
          <View style={s.accentLine} />

          {/* Title */}
          <Text style={s.contractTitle}>Contrato de Servicios de Banquetes</Text>
          <Text style={s.contractSubtitle}>
            Celebrado el {fmtDate(data.createdAt)}
            {data.signedAt ? ` · Firmado el ${fmtDate(data.signedAt)}` : " · Pendiente de firma"}
          </Text>

          {/* Parties */}
          <View style={s.partiesRow}>
            <View style={s.partyBox}>
              <Text style={s.partyLabel}>Prestador de servicios</Text>
              <Text style={s.partyName}>{orgName}</Text>
            </View>
            <View style={s.partyBox}>
              <Text style={s.partyLabel}>Cliente</Text>
              <Text style={s.partyName}>{data.clientName}</Text>
              {data.clientPhone && <Text style={s.partyDetail}>{data.clientPhone}</Text>}
              {data.clientEmail && <Text style={s.partyDetail}>{data.clientEmail}</Text>}
            </View>
          </View>

          {/* Event summary */}
          <View style={s.eventBox}>
            <View>
              <Text style={s.eventLabel}>Evento</Text>
              <Text style={s.eventValue}>{data.eventName}</Text>
              <Text style={s.eventValueSm}>
                {fmtDate(data.eventDate)} · {data.guestCount} invitados
                {data.location ? ` · ${data.location}` : ""}
              </Text>
            </View>
            <View style={s.amountBadge}>
              <Text style={s.amountLabel}>Valor total</Text>
              <Text style={s.amountValue}>{fmt(data.total)}</Text>
            </View>
          </View>

          {/* Clauses */}
          {data.clauses.map((clause, i) => (
            <View key={clause.id} style={s.clauseSection} wrap={false}>
              <Text style={s.clauseTitle}>{i + 1}. {clause.title}</Text>
              <Text style={s.clauseText}>{clause.content}</Text>
            </View>
          ))}

          {/* Notes */}
          {data.notes && (
            <View style={s.clauseSection}>
              <Text style={s.clauseTitle}>Notas adicionales</Text>
              <Text style={s.clauseText}>{data.notes}</Text>
            </View>
          )}

          {/* Signatures */}
          <View style={s.sigsRow}>
            <View style={s.sigBox}>
              <Text style={s.sigLabel}>Firma del prestador de servicios</Text>
              <Text style={s.sigName}>{orgName}</Text>
            </View>
            <View style={s.sigBox}>
              <Text style={s.sigLabel}>Firma del cliente</Text>
              <Text style={s.sigName}>{data.clientName}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>{orgName}</Text>
          <Text style={s.footerGold}>Este documento tiene validez contractual con firma de ambas partes</Text>
          <Text style={s.pageNum} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
