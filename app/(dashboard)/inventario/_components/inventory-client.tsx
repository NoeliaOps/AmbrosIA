"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Search, AlertTriangle, Warehouse } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { formatCurrency } from "@/lib/utils"
import { createInventoryItem, updateInventoryItem, deleteInventoryItem } from "../actions"

const ACCENT = "#6B4A2F"
const LOW = "#991B1B"

export type IngredientOption = { id: string; name: string; unit: string; category: string | null; current_price: number }
export type InventoryItem = {
  id: string
  quantity: number
  min_quantity: number
  notes: string | null
  updated_at: string
  ingredients: { id: string; name: string; unit: string; category: string | null; current_price: number } | null
}

type Props = { items: InventoryItem[]; ingredients: IngredientOption[] }

export function InventoryClient({ items: initial, ingredients }: Props) {
  const [items, setItems] = useState(initial)
  const [query, setQuery] = useState("")
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<InventoryItem | null>(null)
  const [deleting, setDeleting] = useState<InventoryItem | null>(null)
  const [loading, setLoading] = useState(false)

  // form fields
  const [ingredientId, setIngredientId] = useState("")
  const [quantity, setQuantity] = useState("0")
  const [minQuantity, setMinQuantity] = useState("0")

  const trackedIds = new Set(items.map((i) => i.ingredients?.id))
  const available = ingredients.filter((i) => !trackedIds.has(i.id))

  const isLow = (i: InventoryItem) => i.quantity <= i.min_quantity
  const lowItems = items.filter(isLow)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = !q ? items : items.filter((i) =>
      (i.ingredients?.name ?? "").toLowerCase().includes(q) || (i.ingredients?.category ?? "").toLowerCase().includes(q)
    )
    // bajo stock primero, luego por nombre
    return [...list].sort((a, b) => (Number(isLow(b)) - Number(isLow(a))) || (a.ingredients?.name ?? "").localeCompare(b.ingredients?.name ?? ""))
  }, [items, query])

  function openAdd() {
    setIngredientId(""); setQuantity("0"); setMinQuantity("0"); setAddOpen(true)
  }
  function openEdit(item: InventoryItem) {
    setEditing(item); setQuantity(String(item.quantity)); setMinQuantity(String(item.min_quantity))
  }

  async function submitAdd() {
    setLoading(true)
    const res = await createInventoryItem({
      ingredient_id: ingredientId,
      quantity: parseFloat(quantity) || 0,
      min_quantity: parseFloat(minQuantity) || 0,
    })
    if (res.error || !res.data) { toast.error(res.error ?? "Error"); setLoading(false); return }
    const ing = ingredients.find((i) => i.id === ingredientId) ?? null
    setItems((prev) => [{ ...(res.data as unknown as InventoryItem), ingredients: ing }, ...prev])
    toast.success("Insumo agregado al inventario")
    setAddOpen(false); setLoading(false)
  }

  async function submitEdit() {
    if (!editing) return
    setLoading(true)
    const res = await updateInventoryItem(editing.id, { quantity: parseFloat(quantity) || 0, min_quantity: parseFloat(minQuantity) || 0 })
    if (res.error) { toast.error(res.error); setLoading(false); return }
    setItems((prev) => prev.map((i) => i.id === editing.id ? { ...i, quantity: parseFloat(quantity) || 0, min_quantity: parseFloat(minQuantity) || 0 } : i))
    toast.success("Existencias actualizadas")
    setEditing(null); setLoading(false)
  }

  async function confirmDelete() {
    if (!deleting) return
    setLoading(true)
    const res = await deleteInventoryItem(deleting.id)
    if (res.error) { toast.error(res.error); setLoading(false); return }
    setItems((prev) => prev.filter((i) => i.id !== deleting.id))
    toast.success("Insumo retirado del inventario")
    setDeleting(null); setLoading(false)
  }

  return (
    <>
      <div className="flex items-center gap-3 flex-wrap justify-between">
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar insumo…" className="pl-9 h-9 font-sans" />
        </div>
        <Button onClick={openAdd} disabled={available.length === 0} className="bg-[#2D2926] hover:bg-[#1A1714] text-white font-sans font-medium">
          <Plus size={16} className="mr-1" /> Agregar insumo
        </Button>
      </div>

      {lowItems.length > 0 && (
        <div className="rounded-lg border px-4 py-3 flex items-start gap-3" style={{ borderColor: `color-mix(in srgb, ${LOW} 30%, white)`, background: `color-mix(in srgb, ${LOW} 4%, white)` }}>
          <AlertTriangle size={16} className="shrink-0 mt-0.5" style={{ color: LOW }} />
          <div>
            <p className="text-sm font-sans font-semibold" style={{ color: "var(--text-1)" }}>
              {lowItems.length} insumo{lowItems.length !== 1 ? "s" : ""} en o por debajo del mínimo
            </p>
            <p className="text-xs font-sans" style={{ color: "var(--text-2)" }}>
              {lowItems.map((i) => i.ingredients?.name).filter(Boolean).slice(0, 6).join(" · ")}
            </p>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState icon={Warehouse} title="Inventario vacío"
          description="Agrega insumos de tu catálogo de ingredientes para llevar su existencia."
          action={available.length > 0 ? { label: "Agregar insumo", onClick: openAdd } : undefined} />
      ) : filtered.length === 0 ? (
        <div className="enterprise-card py-12 text-center">
          <p className="text-sm font-sans text-muted-foreground">Ningún insumo coincide con “{query}”.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 stagger-children">
          {filtered.map((item) => {
            const low = isLow(item)
            const ing = item.ingredients
            return (
              <div key={item.id} className="enterprise-card p-4 flex flex-col gap-3 group"
                style={low ? { borderColor: `color-mix(in srgb, ${LOW} 30%, white)` } : undefined}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "1rem", fontWeight: 600, color: "var(--text-1)", lineHeight: 1.2 }} className="truncate">{ing?.name ?? "—"}</p>
                    <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.7rem", color: "var(--text-3)" }} className="truncate">
                      {ing?.category ?? "Sin categoría"} · {formatCurrency(ing?.current_price ?? 0)}/{ing?.unit}
                    </p>
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(item)}><Pencil size={14} /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleting(item)}><Trash2 size={14} /></Button>
                  </div>
                </div>

                <div className="mt-auto flex items-end justify-between pt-2" style={{ borderTop: "1px solid var(--border-def, #EBEBEC)" }}>
                  <div>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)" }}>Existencia</p>
                    <p className="mono-data" style={{ fontSize: "1.3rem", fontWeight: 700, color: low ? LOW : ACCENT, lineHeight: 1.1 }}>
                      {item.quantity}<span style={{ fontSize: "0.7rem", color: "var(--text-3)", fontWeight: 400 }}> {ing?.unit}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    {low ? (
                      <span className="inline-flex items-center gap-1" style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: LOW }}>
                        <AlertTriangle size={11} /> Bajo · mín {item.min_quantity}
                      </span>
                    ) : (
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-3)" }}>mín {item.min_quantity} {ing?.unit}</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Agregar */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-heading">Agregar insumo al inventario</DialogTitle></DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label className="font-sans text-sm">Insumo</Label>
              <Select value={ingredientId} onValueChange={(v) => setIngredientId(v ?? "")}>
                <SelectTrigger className="font-sans"><SelectValue placeholder="Selecciona un ingrediente" /></SelectTrigger>
                <SelectContent>
                  {available.map((i) => (
                    <SelectItem key={i.id} value={i.id} className="font-sans">{i.name} <span className="text-muted-foreground">({i.unit})</span></SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-sans text-sm">Existencia</Label>
                <Input type="number" step="0.001" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="font-sans text-sm">Mínimo</Label>
                <Input type="number" step="0.001" min="0" value={minQuantity} onChange={(e) => setMinQuantity(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="font-sans">Cancelar</Button>
            <Button onClick={submitAdd} disabled={loading || !ingredientId} className="bg-[#2D2926] hover:bg-[#1A1714] text-white font-sans font-medium">
              {loading ? "Guardando…" : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ajustar */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-heading">Ajustar existencias</DialogTitle></DialogHeader>
          <p className="text-sm font-sans text-muted-foreground -mt-1">{editing?.ingredients?.name}</p>
          <div className="grid grid-cols-2 gap-3 py-1">
            <div className="space-y-1.5">
              <Label className="font-sans text-sm">Existencia ({editing?.ingredients?.unit})</Label>
              <Input type="number" step="0.001" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="font-sans text-sm">Mínimo</Label>
              <Input type="number" step="0.001" min="0" value={minQuantity} onChange={(e) => setMinQuantity(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} className="font-sans">Cancelar</Button>
            <Button onClick={submitEdit} disabled={loading} className="bg-[#2D2926] hover:bg-[#1A1714] text-white font-sans font-medium">
              {loading ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Eliminar */}
      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-heading">Retirar del inventario</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground font-sans">
            ¿Retirar <strong>{deleting?.ingredients?.name}</strong> del inventario? El ingrediente seguirá en tu catálogo.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} className="font-sans">Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={loading} className="font-sans">{loading ? "Retirando…" : "Retirar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
