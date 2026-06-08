"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Star, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/utils"
import { UNITS_OF_MEASURE } from "@/lib/constants"
import { basePriceFrom } from "@/lib/units"
import { createPurchaseUnit, updatePurchaseUnit, deletePurchaseUnit } from "../purchase-unit-actions"

export type PurchaseUnit = {
  id: string
  unit: string
  factor: number
  price: number
  supplier_id: string | null
  is_default: boolean
  whole_units: boolean
}
type Supplier = { id: string; name: string }

type Props = {
  open: boolean
  onOpenChange: (o: boolean) => void
  ingredient: { id: string; name: string; unit: string }
  units: PurchaseUnit[]
  suppliers: Supplier[]
  onChange: (units: PurchaseUnit[], basePrice: number) => void
}

type FormState = { unit: string; factor: string; price: string; supplier_id: string; whole_units: boolean; is_default: boolean }
const empty: FormState = { unit: "", factor: "1", price: "", supplier_id: "", whole_units: true, is_default: false }

export function PurchaseUnitsDialog({ open, onOpenChange, ingredient, units, suppliers, onChange }: Props) {
  const [list, setList] = useState<PurchaseUnit[]>(units)
  const [editing, setEditing] = useState<PurchaseUnit | null>(null)
  const [form, setForm] = useState<FormState>(empty)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  function propagate(next: PurchaseUnit[]) {
    setList(next)
    const def = next.find((u) => u.is_default) ?? next[0]
    onChange(next, basePriceFrom(def ?? null))
  }

  function openAdd() {
    setEditing(null)
    setForm({ ...empty, unit: ingredient.unit, is_default: list.length === 0 })
    setShowForm(true)
  }
  function openEdit(u: PurchaseUnit) {
    setEditing(u)
    setForm({ unit: u.unit, factor: String(u.factor), price: String(u.price), supplier_id: u.supplier_id ?? "", whole_units: u.whole_units, is_default: u.is_default })
    setShowForm(true)
  }

  async function save() {
    const factor = Number(form.factor)
    const price = Number(form.price)
    if (!form.unit) { toast.error("Selecciona la unidad de compra"); return }
    if (!factor || factor <= 0) { toast.error("La equivalencia debe ser mayor a 0"); return }
    setSaving(true)
    const payload = { unit: form.unit, factor, price: price || 0, supplier_id: form.supplier_id || null, whole_units: form.whole_units, is_default: form.is_default }
    if (editing) {
      const { data, error } = await updatePurchaseUnit(editing.id, ingredient.id, payload)
      if (error || !data) { toast.error(error ?? "Error"); setSaving(false); return }
      const row = data as unknown as PurchaseUnit
      let next = list.map((u) => u.id === editing.id ? row : u)
      if (row.is_default) next = next.map((u) => u.id === row.id ? u : { ...u, is_default: false })
      propagate(next)
      toast.success("Presentación actualizada")
    } else {
      const { data, error } = await createPurchaseUnit(ingredient.id, payload)
      if (error || !data) { toast.error(error ?? "Error"); setSaving(false); return }
      const row = data as unknown as PurchaseUnit
      let next = [...list, row]
      if (row.is_default) next = next.map((u) => u.id === row.id ? u : { ...u, is_default: false })
      propagate(next)
      toast.success("Presentación agregada")
    }
    setShowForm(false)
    setSaving(false)
  }

  async function makeDefault(u: PurchaseUnit) {
    if (u.is_default) return
    const { error } = await updatePurchaseUnit(u.id, ingredient.id, { unit: u.unit, factor: u.factor, price: u.price, supplier_id: u.supplier_id, whole_units: u.whole_units, is_default: true })
    if (error) { toast.error(error); return }
    propagate(list.map((x) => ({ ...x, is_default: x.id === u.id })))
    toast.success("Predeterminada actualizada")
  }

  async function remove(u: PurchaseUnit) {
    const { error } = await deletePurchaseUnit(u.id, ingredient.id)
    if (error) { toast.error(error); return }
    const next = list.filter((x) => x.id !== u.id)
    if (u.is_default && next.length > 0 && !next.some((x) => x.is_default)) next[0].is_default = true
    propagate(next)
    toast.success("Presentación eliminada")
  }

  const supplierName = (id: string | null) => suppliers.find((s) => s.id === id)?.name

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Presentaciones de compra — {ingredient.name}</DialogTitle>
        </DialogHeader>

        <p className="text-sm font-sans text-muted-foreground -mt-1">
          La unidad de receta es <strong>{ingredient.unit}</strong>. Define cómo se compra y la equivalencia
          (cuántos <strong>{ingredient.unit}</strong> trae cada presentación). La predeterminada se usa para costear y comprar.
        </p>

        <div className="rounded-md border border-border overflow-hidden">
          {list.length === 0 ? (
            <p className="py-6 text-center text-sm font-sans text-muted-foreground">Sin presentaciones.</p>
          ) : list.map((u, i) => (
            <div key={u.id} className={`flex items-center gap-3 px-3 py-2.5 ${i > 0 ? "border-t border-border" : ""}`}>
              <button onClick={() => makeDefault(u)} title={u.is_default ? "Predeterminada" : "Hacer predeterminada"}>
                <Star size={15} style={{ color: u.is_default ? "var(--amber)" : "var(--text-3)", fill: u.is_default ? "var(--amber)" : "transparent" }} />
              </button>
              <div className="flex-1 min-w-0">
                <p className="font-sans text-sm font-medium" style={{ color: "var(--text-1)" }}>
                  {u.unit}
                  <span className="text-muted-foreground font-normal"> · 1 {u.unit} = {u.factor} {ingredient.unit}</span>
                </p>
                <p className="text-xs font-sans text-muted-foreground">
                  {formatCurrency(u.price)} {u.factor !== 1 && <>· {formatCurrency(basePriceFrom(u))}/{ingredient.unit}</>}
                  {supplierName(u.supplier_id) ? ` · ${supplierName(u.supplier_id)}` : ""}
                  {u.whole_units ? " · se compra completa" : " · fraccionable"}
                </p>
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(u)}><Pencil size={13} /></Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => remove(u)}><Trash2 size={13} /></Button>
            </div>
          ))}
        </div>

        {showForm ? (
          <div className="rounded-md border border-border p-3 space-y-3" style={{ background: "var(--surface-2, #F4F4F5)" }}>
            <div className="flex items-center justify-between">
              <p className="font-sans text-sm font-semibold">{editing ? "Editar presentación" : "Nueva presentación"}</p>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X size={15} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-sans text-xs">Unidad de compra</Label>
                <Select value={form.unit} onValueChange={(v) => setForm((f) => ({ ...f, unit: v ?? "" }))}>
                  <SelectTrigger className="font-sans h-9"><SelectValue placeholder="Caja, kg, pza…" /></SelectTrigger>
                  <SelectContent>
                    {UNITS_OF_MEASURE.map((u) => <SelectItem key={u} value={u} className="font-sans">{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="font-sans text-xs">Equivalencia (1 = ? {ingredient.unit})</Label>
                <Input type="number" step="0.000001" min="0" value={form.factor} onChange={(e) => setForm((f) => ({ ...f, factor: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="font-sans text-xs">Precio por {form.unit || "presentación"} (MXN)</Label>
                <Input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="0.00" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-sans text-xs">Proveedor</Label>
                <Select value={form.supplier_id} onValueChange={(v) => setForm((f) => ({ ...f, supplier_id: v ?? "" }))}>
                  <SelectTrigger className="font-sans h-9"><SelectValue placeholder="Sin proveedor" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="" className="font-sans">Sin proveedor</SelectItem>
                    {suppliers.map((s) => <SelectItem key={s.id} value={s.id} className="font-sans">{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.whole_units} onChange={(e) => setForm((f) => ({ ...f, whole_units: e.target.checked }))} className="h-4 w-4 rounded border-border accent-gold" />
                <span className="font-sans text-xs">Se compra completa (redondear hacia arriba)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_default} onChange={(e) => setForm((f) => ({ ...f, is_default: e.target.checked }))} className="h-4 w-4 rounded border-border accent-gold" />
                <span className="font-sans text-xs">Predeterminada</span>
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)} className="font-sans">Cancelar</Button>
              <Button size="sm" onClick={save} disabled={saving} className="bg-[#2D2926] hover:bg-[#1A1714] text-white font-sans"><Check size={13} className="mr-1" />{saving ? "Guardando…" : "Guardar"}</Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="sm" className="font-sans w-fit" onClick={openAdd}>
            <Plus size={14} className="mr-1" /> Agregar presentación
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
