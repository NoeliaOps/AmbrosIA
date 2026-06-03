import React from "react"
import {
  Document, Page, View, Text, StyleSheet, Font, Image as PdfImage,
} from "@react-pdf/renderer"

// Register fonts — TTF via Google Fonts CDN
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

const GOLD = "#C6A56B"
const INK = "#0F0F0F"
const CHARCOAL = "#3C3C3C"
const CREAM = "#F3F0E9"
const BORDER = "#D8D3C8"
const MUTED = "#6B6660"

const s = StyleSheet.create({
  page: { fontFamily: "Inter", fontSize: 9, color: INK, backgroundColor: "#FFFFFF", paddingTop: 0, paddingBottom: 48, paddingHorizontal: 0 },
  // Header band
  headerBand: { backgroundColor: INK, paddingHorizontal: 36, paddingVertical: 24, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  headerLogo: { fontFamily: "Playfair", fontSize: 22, fontWeight: 700, color: "#FFFFFF", letterSpacing: 0.5 },
  headerSub: { fontFamily: "Inter", fontSize: 7, color: GOLD, letterSpacing: 2, textTransform: "uppercase", marginTop: 3 },
  headerTag: { fontFamily: "Inter", fontSize: 7, color: GOLD, letterSpacing: 2, textTransform: "uppercase", textAlign: "right" },
  headerTagNum: { fontFamily: "Playfair", fontSize: 14, color: "#FFFFFF", textAlign: "right", marginTop: 2 },
  // Body
  body: { paddingHorizontal: 36, paddingTop: 24 },
  // Gold accent line
  accentLine: { height: 2, backgroundColor: GOLD, marginBottom: 20 },
  // Two-col meta
  metaRow: { flexDirection: "row", gap: 24, marginBottom: 24 },
  metaBox: { flex: 1, backgroundColor: CREAM, borderRadius: 3, padding: 12 },
  metaLabel: { fontFamily: "Inter", fontSize: 6.5, color: MUTED, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 },
  metaValue: { fontFamily: "Playfair", fontSize: 11, fontWeight: 700, color: INK },
  metaValueSm: { fontFamily: "Inter", fontSize: 8, color: CHARCOAL, marginTop: 2 },
  // Section header
  sectionHeader: { fontFamily: "Inter", fontSize: 6.5, color: MUTED, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8, borderBottom: `1pt solid ${BORDER}`, paddingBottom: 4 },
  // Table
  tableHeader: { flexDirection: "row", backgroundColor: INK, borderRadius: 2, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 1 },
  tableHeaderCell: { fontFamily: "Inter", fontSize: 7, fontWeight: 600, color: "#FFFFFF", letterSpacing: 0.8 },
  tableRow: { flexDirection: "row", paddingHorizontal: 10, paddingVertical: 7, borderBottom: `0.5pt solid ${BORDER}` },
  tableRowAlt: { flexDirection: "row", paddingHorizontal: 10, paddingVertical: 7, borderBottom: `0.5pt solid ${BORDER}`, backgroundColor: "#F9F7F4" },
  col1: { flex: 5 },
  col2: { flex: 1.5, textAlign: "center" },
  col3: { flex: 1.5, textAlign: "right" },
  col4: { flex: 1.5, textAlign: "right" },
  cellMain: { fontFamily: "Inter", fontSize: 8.5, color: INK },
  cellMuted: { fontFamily: "Inter", fontSize: 7.5, color: MUTED },
  cellNum: { fontFamily: "Inter", fontSize: 8.5, color: INK },
  // Totals
  totalsBox: { marginTop: 16, alignSelf: "flex-end", width: 220 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottom: `0.5pt solid ${BORDER}` },
  totalLabel: { fontFamily: "Inter", fontSize: 8, color: MUTED },
  totalValue: { fontFamily: "Inter", fontSize: 8, color: INK },
  grandRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, backgroundColor: INK, borderRadius: 2, paddingHorizontal: 10, marginTop: 4 },
  grandLabel: { fontFamily: "Playfair", fontSize: 10, fontWeight: 700, color: "#FFFFFF" },
  grandValue: { fontFamily: "Playfair", fontSize: 10, fontWeight: 700, color: GOLD },
  // Notes
  notesBox: { marginTop: 20, backgroundColor: CREAM, borderRadius: 3, padding: 12 },
  notesLabel: { fontFamily: "Inter", fontSize: 6.5, color: MUTED, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 5 },
  notesText: { fontFamily: "Inter", fontSize: 8, color: CHARCOAL, lineHeight: 1.5 },
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

export type QuotePDFData = {
  logoPath?: string
  orgName?: string
  quoteNumber: string
  createdAt: string
  eventName: string
  eventDate: string
  guestCount: number
  clientName: string
  clientPhone?: string | null
  clientEmail?: string | null
  items: { description: string; quantity: number; unit_cost: number; total_cost: number }[]
  subtotal: number
  discountAmount: number
  total: number
  marginPercent?: number | null
  notes?: string | null
}

export function QuotePDF({ data }: { data: QuotePDFData }) {
  const orgName = data.orgName ?? "Banquetes"
  return (
    <Document
      title={`Cotización — ${data.eventName}`}
      author={orgName}
      subject="Cotización de servicios de banquetes"
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
            <Text style={s.headerTag}>Cotización</Text>
            <Text style={s.headerTagNum}>#{data.quoteNumber}</Text>
          </View>
        </View>

        <View style={s.body}>
          {/* Gold line */}
          <View style={s.accentLine} />

          {/* Meta: event + client */}
          <View style={s.metaRow}>
            <View style={s.metaBox}>
              <Text style={s.metaLabel}>Evento</Text>
              <Text style={s.metaValue}>{data.eventName}</Text>
              <Text style={s.metaValueSm}>{fmtDate(data.eventDate)} · {data.guestCount} invitados</Text>
            </View>
            <View style={s.metaBox}>
              <Text style={s.metaLabel}>Cliente</Text>
              <Text style={s.metaValue}>{data.clientName}</Text>
              {data.clientPhone && <Text style={s.metaValueSm}>{data.clientPhone}</Text>}
              {data.clientEmail && <Text style={s.metaValueSm}>{data.clientEmail}</Text>}
            </View>
            <View style={s.metaBox}>
              <Text style={s.metaLabel}>Fecha de cotización</Text>
              <Text style={s.metaValue}>{fmtDate(data.createdAt)}</Text>
              {data.marginPercent && (
                <Text style={s.metaValueSm}>Margen estimado: {data.marginPercent}%</Text>
              )}
            </View>
          </View>

          {/* Items table */}
          <Text style={s.sectionHeader}>Desglose de servicios</Text>

          <View style={s.tableHeader}>
            <View style={s.col1}><Text style={s.tableHeaderCell}>Concepto</Text></View>
            <View style={s.col2}><Text style={{ ...s.tableHeaderCell, textAlign: "center" }}>Cant.</Text></View>
            <View style={s.col3}><Text style={{ ...s.tableHeaderCell, textAlign: "right" }}>P. unit.</Text></View>
            <View style={s.col4}><Text style={{ ...s.tableHeaderCell, textAlign: "right" }}>Total</Text></View>
          </View>

          {data.items.map((item, i) => (
            <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
              <View style={s.col1}><Text style={s.cellMain}>{item.description}</Text></View>
              <View style={s.col2}><Text style={{ ...s.cellNum, textAlign: "center" }}>{item.quantity}</Text></View>
              <View style={s.col3}><Text style={{ ...s.cellNum, textAlign: "right" }}>{fmt(item.unit_cost)}</Text></View>
              <View style={s.col4}><Text style={{ ...s.cellNum, textAlign: "right" }}>{fmt(item.total_cost)}</Text></View>
            </View>
          ))}

          {/* Totals */}
          <View style={s.totalsBox}>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Subtotal</Text>
              <Text style={s.totalValue}>{fmt(data.subtotal)}</Text>
            </View>
            {data.discountAmount > 0 && (
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Descuento</Text>
                <Text style={{ ...s.totalValue, color: "#B06045" }}>-{fmt(data.discountAmount)}</Text>
              </View>
            )}
            <View style={s.grandRow}>
              <Text style={s.grandLabel}>Total</Text>
              <Text style={s.grandValue}>{fmt(data.total)}</Text>
            </View>
          </View>

          {/* Notes */}
          {data.notes && (
            <View style={s.notesBox}>
              <Text style={s.notesLabel}>Notas y condiciones</Text>
              <Text style={s.notesText}>{data.notes}</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>{orgName}</Text>
          <Text style={s.footerGold}>Gastronomía artesanal para eventos memorables</Text>
          <Text style={s.pageNum} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
