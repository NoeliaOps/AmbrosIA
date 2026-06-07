"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Zap, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { formatCurrency } from "@/lib/utils"
import { createOverhead, updateOverhead, deleteOverhead } from "../overhead-actions"

const ACCENT = "#6B4A2F"

export type OverheadRow = { id: string; concept: string; amount: number; period: string }
type Props = { overhead: OverheadRow[]; eventCounts: Record<string, number> }

function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number)
  const label = new Date(y, m - 1, 1).toLocaleDateString("es-MX", { month: "long", year: "numeric" })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

const CONCEPT_SUGGESTIONS = ["Gas", "Luz", "Renta", "Agua", "Internet", "Sueldos base", "Mantenimiento"]

export function OverheadClient({ overhead: initial, eventCounts }: Props) {
  const [overhead, setOverhead] = useState(initial)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<OverheadRow | null>(null)
  const [loading, setLoading] = useState(false)
  const thisMonth = new Date().toISOString().slice(0, 7)
  const [form, setForm] = useState({ concept: "", month: thisMonth, amount: "" })

  const groups = useMemo(() => {
    const map = new Map<string, OverheadRow[]>()
    for (const o of overhead) {
      const key = o.period.slice(0, 7)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(o)
    }
    return [...map.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, items]) => {
        const total = items.reduce((s, i) => s + i.amount, 0)
        const events = eventCounts[key] ?? 0
        const perEvent = events > 0 ? total / events : null
        return { key, items, total, events, perEvent }
      })
  }, [overhead, eventCounts])

  function openNew() {
    setEditing(null); setForm({ concept: "", month: thisMonth, amount: "" }); setOpen(true)
  }
  function openEdit(o: OverheadRow) {
    setEditing(o); setForm({ concept: o.concept, month: o.period.slice(0, 7), amount: String(o.amount) }); setOpen(true)
  }

  async function save() {
    if (!form.concept.trim()) { toast.error("Indica el concepto"); return }
    setLoading(true)
    const payload = { concept: form.concept.trim(), amount: Number(form.amount) || 0, month: form.month }
    const res = editing ? await updateOverhead(editing.id, payload) : await createOverhead(payload)
    if (res.error || !res.data) { toast.error(res.error ?? "Error"); setLoading(false); return }
    const row = res.data as unknown as OverheadRow
    setOverhead((prev) => editing ? prev.map((o) => o.id === editing.id ? row : o) : [...prev, row])
    toast.success(editing ? "Gasto actualizado" : "Gasto registrado")
    setOpen(false); setLoading(false)
  }

  async function remove(o: OverheadRow) {
    const res = await deleteOverhead(o.id)
    if (res.error) { toast.error(res.error); return }
    setOverhead((prev) => prev.filter((x) => x.id !== o.id))
    toast.success("Gasto eliminado")
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <p className="text-sm font-sans text-muted-foreground max-w-xl">
          Sube los gastos generales del negocio (gas, luz, renta, etc.) por mes. El total de cada mes se
          <strong> reparte entre el número de eventos</strong> de ese mes para obtener el costo fijo por evento.
        </p>
        <Button onClick={openNew} className="bg-[#2D2926] hover:bg-[#1A1714] text-white font-sans font-medium">
          <Plus size={16} className="mr-1" /> Registrar gasto
        </Button>
      </div>

      {overhead.length === 0 ? (
        <EmptyState icon={Zap} title="Sin gastos generales"
          description="Registra el gas, la luz, la renta y demás gastos fijos del mes para prorratearlos por evento."
          action={{ label: "Registrar gasto", onClick: openNew }} />
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <section key={g.key} className="enterprise-card overflow-hidden">
              <div className="table-header px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <CalendarDays size={15} style={{ color: ACCENT }} />
                  <h3 style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "1rem", fontWeight: 600, color: "var(--text-1)" }}>{monthLabel(g.key)}</h3>
                </div>
                <div className="flex items-center gap-5 text-right">
                  <div>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)" }}>Total gastos</p>
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
                {g.items.map((o) => (
                  <div key={o.id} className="flex items-center gap-3 px-4 py-2.5 group">
                    <span className="flex-1 font-sans text-sm" style={{ color: "var(--text-1)" }}>{o.concept}</span>
                    <span className="mono-data text-sm font-medium">{formatCurrency(o.amount)}</span>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(o)}><Pencil size={13} /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => remove(o)}><Trash2 size={13} /></Button>
                    </div>
                  </div>
                ))}
              </div>
              {g.events === 0 && (
                <p className="px-4 py-2 text-xs font-sans text-muted-foreground italic" style={{ borderTop: "1px solid var(--border-def, #EBEBEC)" }}>
                  Sin eventos registrados este mes — el prorrateo se calculará cuando haya eventos.
                </p>
              )}
            </section>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-heading">{editing ? "Editar gasto" : "Registrar gasto"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label className="font-sans text-sm">Concepto *</Label>
              <Input list="overhead-concepts" value={form.concept} onChange={(e) => setForm((f) => ({ ...f, concept: e.target.value }))} placeholder="Gas, Luz, Renta…" />
              <datalist id="overhead-concepts">
                {CONCEPT_SUGGESTIONS.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-sans text-sm">Mes *</Label>
                <Input type="month" value={form.month} onChange={(e) => setForm((f) => ({ ...f, month: e.target.value }))} />
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
