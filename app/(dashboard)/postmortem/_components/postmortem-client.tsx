"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { MessageSquare, Star, Pencil, ExternalLink, ThumbsUp, ThumbsDown, Lightbulb, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { formatShortDate } from "@/lib/utils"
import { savePostmortem, deletePostmortem } from "../actions"

const ACCENT = "#3C3C3C"
const GOLD = "#8B6D24"

type Postmortem = { id: string; rating: number | null; went_well: string | null; to_improve: string | null; lessons: string | null; updated_at: string }
export type EventWithPostmortem = {
  id: string
  name: string
  event_date: string
  guest_count: number
  clients: { name: string } | null
  event_postmortems: Postmortem[]
}

export function PostmortemClient({ events: initial }: { events: EventWithPostmortem[] }) {
  const [events, setEvents] = useState(initial)
  const [editing, setEditing] = useState<EventWithPostmortem | null>(null)
  const [loading, setLoading] = useState(false)

  const [rating, setRating] = useState<number | null>(null)
  const [wentWell, setWentWell] = useState("")
  const [toImprove, setToImprove] = useState("")
  const [lessons, setLessons] = useState("")

  const withPm = events.filter((e) => e.event_postmortems.length > 0).length

  function open(ev: EventWithPostmortem) {
    const pm = ev.event_postmortems[0]
    setRating(pm?.rating ?? null)
    setWentWell(pm?.went_well ?? "")
    setToImprove(pm?.to_improve ?? "")
    setLessons(pm?.lessons ?? "")
    setEditing(ev)
  }

  async function save() {
    if (!editing) return
    setLoading(true)
    const res = await savePostmortem({
      event_id: editing.id, rating,
      went_well: wentWell || undefined, to_improve: toImprove || undefined, lessons: lessons || undefined,
    })
    if (res.error || !res.data) { toast.error(res.error ?? "Error"); setLoading(false); return }
    const saved = res.data as unknown as Postmortem
    setEvents((prev) => prev.map((e) => e.id === editing.id ? { ...e, event_postmortems: [saved] } : e))
    toast.success("Retrospectiva guardada")
    setEditing(null); setLoading(false)
  }

  async function removePm(ev: EventWithPostmortem) {
    const pm = ev.event_postmortems[0]
    if (!pm) return
    const res = await deletePostmortem(pm.id)
    if (res.error) { toast.error(res.error); return }
    setEvents((prev) => prev.map((e) => e.id === ev.id ? { ...e, event_postmortems: [] } : e))
    toast.success("Retrospectiva eliminada")
  }

  if (events.length === 0) {
    return (
      <div className="enterprise-card p-16 text-center space-y-3">
        <MessageSquare size={32} className="mx-auto text-muted-foreground/40" />
        <p className="font-heading font-semibold">Sin eventos completados</p>
        <p className="text-sm font-sans text-muted-foreground">La retrospectiva está disponible para eventos marcados como completados.</p>
      </div>
    )
  }

  return (
    <>
      <div className="enterprise-card inline-flex items-center gap-5 px-5 py-3.5" style={{ borderLeft: `3px solid ${ACCENT}` }}>
        <div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)" }}>Eventos completados</p>
          <p className="mono-data" style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--text-1)", lineHeight: 1.1 }}>{events.length}</p>
        </div>
        <div className="h-10 w-px" style={{ background: "var(--border-def, #EBEBEC)" }} />
        <div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)" }}>Con retrospectiva</p>
          <p className="mono-data" style={{ fontSize: "1.6rem", fontWeight: 700, color: GOLD, lineHeight: 1.1 }}>{withPm}</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {events.map((ev) => {
          const pm = ev.event_postmortems[0]
          return (
            <div key={ev.id} className="enterprise-card p-4 flex items-start gap-4 group">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <Link href={`/eventos/${ev.id}`} className="flex items-center gap-1.5 hover:text-gold-dark transition-colors min-w-0">
                    <span style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "1rem", fontWeight: 600, color: "var(--text-1)" }} className="truncate">{ev.name}</span>
                    <ExternalLink size={12} className="text-muted-foreground/50 shrink-0" />
                  </Link>
                </div>
                <p className="text-xs font-sans text-muted-foreground mt-0.5">
                  {ev.clients?.name ?? "Sin cliente"} · {formatShortDate(ev.event_date)} · {ev.guest_count} inv.
                </p>

                {pm ? (
                  <div className="mt-2 space-y-1.5">
                    {pm.rating != null && (
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star key={n} size={13} style={{ color: n <= pm.rating! ? GOLD : "var(--surface-3, #EBEBEC)", fill: n <= pm.rating! ? GOLD : "transparent" }} />
                        ))}
                      </div>
                    )}
                    {pm.went_well && <p className="text-xs font-sans flex items-start gap-1.5" style={{ color: "var(--text-2)" }}><ThumbsUp size={12} className="mt-0.5 shrink-0" style={{ color: "#2F6B4F" }} /><span className="line-clamp-1">{pm.went_well}</span></p>}
                    {pm.to_improve && <p className="text-xs font-sans flex items-start gap-1.5" style={{ color: "var(--text-2)" }}><ThumbsDown size={12} className="mt-0.5 shrink-0" style={{ color: "#9A5B3F" }} /><span className="line-clamp-1">{pm.to_improve}</span></p>}
                  </div>
                ) : (
                  <p className="mt-2 text-xs font-sans italic text-muted-foreground">Sin retrospectiva registrada.</p>
                )}
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                <Button size="sm" variant={pm ? "ghost" : "outline"} className="h-7 text-xs font-sans gap-1" onClick={() => open(ev)}>
                  <Pencil size={12} /> {pm ? "Editar" : "Registrar"}
                </Button>
                {pm && (
                  <button onClick={() => removePm(ev)} className="text-[11px] font-sans text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100">
                    <Trash2 size={11} /> Borrar
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Dialog retrospectiva */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading">Retrospectiva — {editing?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label className="font-sans text-sm">Calificación del evento</Label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setRating(n === rating ? null : n)} className="p-0.5">
                    <Star size={22} style={{ color: rating != null && n <= rating ? GOLD : "var(--surface-3, #EBEBEC)", fill: rating != null && n <= rating ? GOLD : "transparent" }} />
                  </button>
                ))}
                {rating != null && <button type="button" onClick={() => setRating(null)} className="ml-2 text-xs font-sans text-muted-foreground hover:text-foreground">Limpiar</button>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="font-sans text-sm flex items-center gap-1.5"><ThumbsUp size={13} style={{ color: "#2F6B4F" }} /> ¿Qué salió bien?</Label>
              <Textarea value={wentWell} onChange={(e) => setWentWell(e.target.value)} rows={2} placeholder="Lo que funcionó y hay que repetir…" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-sans text-sm flex items-center gap-1.5"><ThumbsDown size={13} style={{ color: "#9A5B3F" }} /> ¿Qué mejorar?</Label>
              <Textarea value={toImprove} onChange={(e) => setToImprove(e.target.value)} rows={2} placeholder="Problemas, retrasos, sobrecostos…" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-sans text-sm flex items-center gap-1.5"><Lightbulb size={13} style={{ color: GOLD }} /> Lecciones para el próximo</Label>
              <Textarea value={lessons} onChange={(e) => setLessons(e.target.value)} rows={2} placeholder="Acuerdos accionables para futuros eventos…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} className="font-sans">Cancelar</Button>
            <Button onClick={save} disabled={loading} className="bg-[#2D2926] hover:bg-[#1A1714] text-white font-sans font-medium">{loading ? "Guardando…" : "Guardar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
