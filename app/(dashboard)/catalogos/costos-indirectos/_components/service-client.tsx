"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Sparkles, CalendarRange } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { formatCurrency, weekLabel } from "@/lib/utils"
import { createOverhead, updateOverhead, deleteOverhead } from "../overhead-actions"
import type { OverheadRow } from "./overhead-client"

const ACCENT = "#6B4A2F"

type Props = {
  services: OverheadRow[]
  eventCounts: Record<string, number>      // por mes (YYYY-MM)
  eventCountsWeek: Record<string, number>  // por semana (lunes YYYY-MM-DD)
}

const SERVICE_SUGGESTIONS = [
  "Seguridad", "Vigilancia", "Valet parking", "DJ / Música",
  "Mobiliario y equipo", "Limpieza", "Transporte / Logística", "Carpa",
]

function monthLabelKey(key: string) {
  const [y, m] = key.split("-").map(Number)
  const label = new Date(y, m - 1, 1).toLocaleDateString("es-MX", { month: "long", year: "numeric" })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function todayISO() { return new Date().toISOString().slice(0, 10) }

export function ServiceClient({ services: initial, eventCounts, eventCountsWeek }: Props) {
  const [services, setServices] = useState(initial)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<OverheadRow | null>(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<{ concept: string; period_type: "week" | "month"; week_date: string; month: string; amount: string }>({
    concept: "", period_type: "week", week_date: todayISO(), month: todayISO().slice(0, 7), amount: "",
  })

  // Agrupa por bucket (semana o mes) y calcula el prorrateo por evento.
  const groups = useMemo(() => {
    const map = new Map<string, { key: string; period_type: string; items: OverheadRow[] }>()
    for (const s of services) {
      const k = `${s.period_type}:${s.period}`
      if (!map.has(k)) map.set(k, { key: s.period, period_type: s.period_type, items: [] })
      map.get(k)!.items.push(s)
    }
    return [...map.values()]
      .sort((a, b) => b.key.localeCompare(a.key))
      .map((g) => {
        const total = g.items.reduce((s, i) => s + i.amount, 0)
        const isWeek = g.period_type === "week"
        const events = isWeek ? (eventCountsWeek[g.key] ?? 0) : (eventCounts[g.key.slice(0, 7)] ?? 0)
        return {
          ...g,
          total,
          isWeek,
          label: isWeek ? `Semana ${weekLabel(g.key)}` : monthLabelKey(g.key.slice(0, 7)),
          events,
          perEvent: events > 0 ? total / events : null,
        }
      })
  }, [services, eventCounts, eventCountsWeek])

  function openNew() {
    setEditing(null)
    setForm({ concept: "", period_type: "week", week_date: todayISO(), month: todayISO().slice(0, 7), amount: "" })
    setOpen(true)
  }
  function openEdit(s: OverheadRow) {
    setEditing(s)
    setForm({
      concept: s.concept,
      period_type: s.period_type === "month" ? "month" : "week",
      week_date: s.period_type === "week" ? s.period : todayISO(),
      month: s.period.slice(0, 7),
      amount: String(s.amount),
    })
    setOpen(true)
  }

  async function save() {
    if (!form.concept.trim()) { toast.error("Indica el servicio"); return }
    setLoading(true)
    const payload = {
      concept: form.concept.trim(),
      amount: Number(form.amount) || 0,
      kind: "service" as const,
      period_type: form.period_type,
      period_value: form.period_type === "week" ? form.week_date : form.month,
    }
    const res = editing ? await updateOverhead(editing.id, payload) : await createOverhead(payload)
    if (res.error || !res.data) { toast.error(res.error ?? "Error"); setLoading(false); return }
    const row = res.data as unknown as OverheadRow
    setServices((prev) => editing ? prev.map((s) => s.id === editing.id ? row : s) : [...prev, row])
    toast.success(editing ? "Servicio actualizado" : "Servicio registrado")
    setOpen(false); setLoading(false)
  }

  async function remove(s: OverheadRow) {
    const res = await deleteOverhead(s.id)
    if (res.error) { toast.error(res.error); return }
    setServices((prev) => prev.filter((x) => x.id !== s.id))
    toast.success("Servicio eliminado")
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <p className="text-sm font-sans text-muted-foreground max-w-xl">
          Servicios contratados (seguridad, valet, mobiliario, DJ…) que son costos indirectos. Se
          <strong> reparten entre los eventos de la semana o del mes</strong> elegido. Para un evento grande,
          asígnalo directamente en la pestaña <strong>Compras</strong> del evento.
        </p>
        <Button onClick={openNew} className="bg-[#2D2926] hover:bg-[#1A1714] text-white font-sans font-medium">
          <Plus size={16} className="mr-1" /> Registrar servicio
        </Button>
      </div>

      {services.length === 0 ? (
        <EmptyState icon={Sparkles} title="Sin servicios"
          description="Registra servicios como seguridad, valet o mobiliario y repártelos por semana o por mes entre tus eventos."
          action={{ label: "Registrar servicio", onClick: openNew }} />
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <section key={`${g.period_type}:${g.key}`} className="enterprise-card overflow-hidden">
              <div className="table-header px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <CalendarRange size={15} style={{ color: ACCENT }} />
                  <h3 style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "1rem", fontWeight: 600, color: "var(--text-1)" }}>{g.label}</h3>
                  <span className="text-[10px] font-sans px-1.5 py-0.5 rounded" style={{ color: ACCENT, background: "rgb(107 74 47 / 0.1)" }}>
                    {g.isWeek ? "por semana" : "por mes"}
                  </span>
                </div>
                <div className="flex items-center gap-5 text-right">
                  <div>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)" }}>Total servicios</p>
                    <p className="mono-data" style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-1)" }}>{formatCurrency(g.total)}</p>
                  </div>
                  <div>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)" }}>{g.events} evento{g.events !== 1 ? "s" : ""} · por evento</p>
                    <p className="mono-data" style={{ fontSize: "0.95rem", fontWeight: 700, color: ACCENT }}>
                      {g.perEvent != null ? formatCurrency(g.perEvent) : "—"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-border">
                {g.items.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 px-4 py-2.5 group">
                    <span className="flex-1 font-sans text-sm" style={{ color: "var(--text-1)" }}>{s.concept}</span>
                    <span className="mono-data text-sm font-medium">{formatCurrency(s.amount)}</span>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(s)}><Pencil size={13} /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => remove(s)}><Trash2 size={13} /></Button>
                    </div>
                  </div>
                ))}
              </div>
              {g.events === 0 && (
                <p className="px-4 py-2 text-xs font-sans text-muted-foreground italic" style={{ borderTop: "1px solid var(--border-def, #EBEBEC)" }}>
                  Sin eventos en este periodo — el prorrateo se calculará cuando haya eventos.
                </p>
              )}
            </section>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-heading">{editing ? "Editar servicio" : "Registrar servicio"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label className="font-sans text-sm">Servicio *</Label>
              <Input list="service-concepts" value={form.concept} onChange={(e) => setForm((f) => ({ ...f, concept: e.target.value }))} placeholder="Seguridad, Valet, Mobiliario…" />
              <datalist id="service-concepts">
                {SERVICE_SUGGESTIONS.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label className="font-sans text-sm">Repartir por</Label>
              <div className="flex gap-2">
                {([["week", "Semana"], ["month", "Mes"]] as const).map(([k, label]) => (
                  <Button key={k} type="button" size="sm" variant={form.period_type === k ? "default" : "outline"}
                    className="font-sans text-xs flex-1" onClick={() => setForm((f) => ({ ...f, period_type: k }))}>
                    {label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-sans text-sm">{form.period_type === "week" ? "Semana (cualquier día)" : "Mes"} *</Label>
                {form.period_type === "week" ? (
                  <Input type="date" value={form.week_date} onChange={(e) => setForm((f) => ({ ...f, week_date: e.target.value }))} />
                ) : (
                  <Input type="month" value={form.month} onChange={(e) => setForm((f) => ({ ...f, month: e.target.value }))} />
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="font-sans text-sm">Monto (MXN) *</Label>
                <Input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="font-sans">Cancelar</Button>
            <Button onClick={save} disabled={loading} className="bg-[#2D2926] hover:bg-[#1A1714] text-white font-sans font-medium">{loading ? "Guardando…" : editing ? "Guardar" : "Registrar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
