"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, TrendingDown, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  createActualPurchase,
  updateActualPurchase,
  deleteActualPurchase,
  upsertEventIndirectCost,
  deleteEventIndirectCost,
} from "../actual-purchases-actions"

// ── types ─────────────────────────────────────────────────────────────────────

type ActualPurchase = {
  id: string
  ingredient_id: string
  quantity: number
  unit: string
  unit_cost: number
  total_cost: number
  purchased_at: string
  notes: string | null
  ingredients: { name: string; unit: string } | null
}

type RequisitionItem = {
  ingredient_id: string
  quantity: number
  unit: string
  unit_cost: number
  total_cost: number
  ingredients: { id: string; name: string; unit: string; current_price: number; preferred_supplier_id: string | null } | null
}

type IndirectCostCategory = {
  id: string
  name: string
  allocation_method: string
  default_amount: number
}

type EventIndirectCost = {
  id: string
  category_id: string
  amount: number
  notes: string | null
  indirect_cost_categories: IndirectCostCategory | null
}

type Props = {
  eventId: string
  guestCount: number
  quoteTotal: number
  requisitionItems: RequisitionItem[]
  initialActualPurchases: ActualPurchase[]
  initialIndirectCosts: EventIndirectCost[]
  indirectCostCategories: IndirectCostCategory[]
  staffCost: number
}

// ── component ─────────────────────────────────────────────────────────────────

export function ComprasTab({
  eventId,
  guestCount,
  quoteTotal,
  requisitionItems,
  initialActualPurchases,
  initialIndirectCosts,
  indirectCostCategories,
  staffCost,
}: Props) {
  const [purchases, setPurchases] = useState<ActualPurchase[]>(initialActualPurchases)
  const [indirectCosts, setIndirectCosts] = useState<EventIndirectCost[]>(initialIndirectCosts)

  // Actual purchase dialog
  const [purchaseOpen, setPurchaseOpen] = useState(false)
  const [editingPurchase, setEditingPurchase] = useState<ActualPurchase | null>(null)
  const [purchaseForm, setPurchaseForm] = useState({
    ingredient_id: "",
    quantity: "",
    unit: "",
    unit_cost: "",
    purchased_at: new Date().toISOString().slice(0, 10),
    notes: "",
  })
  const [savingPurchase, setSavingPurchase] = useState(false)

  // Indirect cost dialog
  const [indirectOpen, setIndirectOpen] = useState(false)
  const [editingIndirect, setEditingIndirect] = useState<EventIndirectCost | null>(null)
  const [indirectForm, setIndirectForm] = useState({ category_id: "", amount: "", notes: "" })
  const [savingIndirect, setSavingIndirect] = useState(false)

  // ── purchase dialog helpers ────────────────────────────────────────────────

  function openNewPurchase(ri?: RequisitionItem) {
    setEditingPurchase(null)
    setPurchaseForm({
      ingredient_id: ri?.ingredient_id ?? "",
      quantity: ri ? String(ri.quantity) : "",
      unit: ri?.unit ?? "",
      unit_cost: ri ? String(ri.unit_cost) : "",
      purchased_at: new Date().toISOString().slice(0, 10),
      notes: "",
    })
    setPurchaseOpen(true)
  }

  function openEditPurchase(p: ActualPurchase) {
    setEditingPurchase(p)
    setPurchaseForm({
      ingredient_id: p.ingredient_id,
      quantity: String(p.quantity),
      unit: p.unit,
      unit_cost: String(p.unit_cost),
      purchased_at: p.purchased_at,
      notes: p.notes ?? "",
    })
    setPurchaseOpen(true)
  }

  async function savePurchase() {
    if (!purchaseForm.ingredient_id || !purchaseForm.quantity || !purchaseForm.unit_cost) {
      toast.error("Completa todos los campos requeridos"); return
    }
    setSavingPurchase(true)
    if (editingPurchase) {
      const { data, error } = await updateActualPurchase(editingPurchase.id, eventId, {
        quantity: Number(purchaseForm.quantity),
        unit_cost: Number(purchaseForm.unit_cost),
        purchased_at: purchaseForm.purchased_at,
        notes: purchaseForm.notes,
      })
      if (error) { toast.error(error); setSavingPurchase(false); return }
      setPurchases((prev) => prev.map((p) =>
        p.id === editingPurchase.id
          ? { ...p, ...(data as unknown as Partial<ActualPurchase>) }
          : p
      ))
      toast.success("Compra actualizada")
    } else {
      const ingName = requisitionItems.find((r) => r.ingredient_id === purchaseForm.ingredient_id)?.ingredients?.name
        ?? purchaseForm.ingredient_id
      const { data, error } = await createActualPurchase(eventId, {
        ingredient_id: purchaseForm.ingredient_id,
        quantity: Number(purchaseForm.quantity),
        unit: purchaseForm.unit,
        unit_cost: Number(purchaseForm.unit_cost),
        purchased_at: purchaseForm.purchased_at,
        notes: purchaseForm.notes,
      })
      if (error) { toast.error(error); setSavingPurchase(false); return }
      setPurchases((prev) => [
        ...prev,
        {
          ...(data as unknown as ActualPurchase),
          ingredients: { name: ingName, unit: purchaseForm.unit },
        },
      ])
      toast.success("Compra registrada")
    }
    setPurchaseOpen(false)
    setSavingPurchase(false)
  }

  async function handleDeletePurchase(p: ActualPurchase) {
    const { error } = await deleteActualPurchase(p.id, eventId)
    if (error) { toast.error(error); return }
    setPurchases((prev) => prev.filter((x) => x.id !== p.id))
    toast.success("Compra eliminada")
  }

  // ── indirect cost helpers ─────────────────────────────────────────────────

  function suggestAmount(categoryId: string): number {
    const cat = indirectCostCategories.find((c) => c.id === categoryId)
    if (!cat) return 0
    if (cat.allocation_method === "per_guest") return cat.default_amount * guestCount
    if (cat.allocation_method === "percentage") return Math.round(cat.default_amount * quoteTotal / 100 * 100) / 100
    return cat.default_amount // fixed / per_event
  }

  function openNewIndirect() {
    setEditingIndirect(null)
    setIndirectForm({ category_id: "", amount: "", notes: "" })
    setIndirectOpen(true)
  }

  function openEditIndirect(ic: EventIndirectCost) {
    setEditingIndirect(ic)
    setIndirectForm({ category_id: ic.category_id, amount: String(ic.amount), notes: ic.notes ?? "" })
    setIndirectOpen(true)
  }

  async function saveIndirect() {
    if (!indirectForm.category_id || !indirectForm.amount) {
      toast.error("Selecciona una categoría e ingresa un monto"); return
    }
    setSavingIndirect(true)
    const { data, error } = await upsertEventIndirectCost(eventId, {
      id: editingIndirect?.id,
      category_id: indirectForm.category_id,
      amount: Number(indirectForm.amount),
      notes: indirectForm.notes,
    })
    if (error) { toast.error(error); setSavingIndirect(false); return }
    if (editingIndirect) {
      setIndirectCosts((prev) => prev.map((ic) =>
        ic.id === editingIndirect.id
          ? { ...ic, amount: Number(indirectForm.amount), notes: indirectForm.notes || null }
          : ic
      ))
    } else {
      const cat = indirectCostCategories.find((c) => c.id === indirectForm.category_id)
      setIndirectCosts((prev) => [
        ...prev,
        {
          ...(data as unknown as EventIndirectCost),
          indirect_cost_categories: cat ? { id: cat.id, name: cat.name, allocation_method: cat.allocation_method, default_amount: cat.default_amount } : null,
        },
      ])
    }
    toast.success(editingIndirect ? "Costo actualizado" : "Costo agregado")
    setIndirectOpen(false)
    setSavingIndirect(false)
  }

  async function handleDeleteIndirect(ic: EventIndirectCost) {
    const { error } = await deleteEventIndirectCost(ic.id, eventId)
    if (error) { toast.error(error); return }
    setIndirectCosts((prev) => prev.filter((x) => x.id !== ic.id))
    toast.success("Costo eliminado")
  }

  // ── computed values ───────────────────────────────────────────────────────

  // Aggregate actual purchases by ingredient_id
  const actualByIngredient = new Map<string, { qty: number; total: number; unit_cost: number }>()
  for (const p of purchases) {
    const prev = actualByIngredient.get(p.ingredient_id)
    if (prev) {
      prev.qty += p.quantity
      prev.total += p.total_cost
    } else {
      actualByIngredient.set(p.ingredient_id, { qty: p.quantity, total: p.total_cost, unit_cost: p.unit_cost })
    }
  }

  const totalIngredientCost = purchases.reduce((s, p) => s + p.total_cost, 0)
  const totalIndirectCost = indirectCosts.reduce((s, ic) => s + ic.amount, 0)
  const profit = quoteTotal - totalIngredientCost - totalIndirectCost - staffCost
  const margin = quoteTotal > 0 ? (profit / quoteTotal) * 100 : 0

  const availableCategories = indirectCostCategories.filter(
    (cat) => !indirectCosts.some((ic) => ic.category_id === cat.id)
  )

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">

      {/* ── Variance table ────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-base font-semibold">Compras reales vs. estimado</h3>
          <Button size="sm" variant="outline" className="font-sans text-xs" onClick={() => openNewPurchase()}>
            <Plus size={13} className="mr-1" /> Registrar compra
          </Button>
        </div>

        {requisitionItems.length === 0 && purchases.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-8 text-center">
            <p className="text-sm font-sans text-muted-foreground">
              Genera una requisición primero para ver la comparación estimado vs. real.
            </p>
          </div>
        ) : (
          <div className="rounded-md border border-border overflow-x-auto">
            <table className="w-full text-sm font-sans">
              <thead>
                <tr className="bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2.5 text-left">Ingrediente</th>
                  <th className="px-3 py-2.5 text-right">Est. cant.</th>
                  <th className="px-3 py-2.5 text-right">Est. total</th>
                  <th className="px-3 py-2.5 text-right">Real cant.</th>
                  <th className="px-3 py-2.5 text-right">Real total</th>
                  <th className="px-3 py-2.5 text-right">Variación</th>
                  <th className="px-3 py-2.5 text-right">%</th>
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {requisitionItems.map((ri) => {
                  const actual = actualByIngredient.get(ri.ingredient_id)
                  const variance = actual ? actual.total - ri.total_cost : null
                  const variancePct = ri.total_cost > 0 && variance !== null ? (variance / ri.total_cost) * 100 : null
                  const isOver = variance !== null && variance > 0
                  const isUnder = variance !== null && variance < 0
                  return (
                    <tr key={ri.ingredient_id} className="border-t border-border hover:bg-muted/20">
                      <td className="px-3 py-2.5 font-medium">
                        {ri.ingredients?.name ?? ri.ingredient_id}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                        {ri.quantity.toFixed(3)} {ri.unit}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                        {formatCurrency(ri.total_cost)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {actual ? `${actual.qty.toFixed(3)} ${ri.unit}` : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums font-medium">
                        {actual ? formatCurrency(actual.total) : "—"}
                      </td>
                      <td className={`px-3 py-2.5 text-right tabular-nums font-medium ${isOver ? "text-red-600" : isUnder ? "text-emerald-700" : "text-muted-foreground"}`}>
                        {variance !== null ? (
                          <span className="flex items-center justify-end gap-1">
                            {isOver ? <TrendingUp size={12} /> : isUnder ? <TrendingDown size={12} /> : null}
                            {variance >= 0 ? "+" : ""}{formatCurrency(variance)}
                          </span>
                        ) : "—"}
                      </td>
                      <td className={`px-3 py-2.5 text-right tabular-nums text-xs ${isOver ? "text-red-600" : isUnder ? "text-emerald-700" : "text-muted-foreground"}`}>
                        {variancePct !== null ? `${variancePct >= 0 ? "+" : ""}${variancePct.toFixed(1)}%` : "—"}
                      </td>
                      <td className="px-3 py-2.5">
                        <Button size="sm" variant="ghost" className="h-7 text-xs font-sans px-2"
                          onClick={() => openNewPurchase(ri)}>
                          {actual ? "Agregar" : "Registrar"}
                        </Button>
                      </td>
                    </tr>
                  )
                })}

                {/* Extra purchases not in requisition */}
                {purchases
                  .filter((p) => !requisitionItems.some((r) => r.ingredient_id === p.ingredient_id))
                  .map((p) => (
                    <tr key={`extra-${p.id}`} className="border-t border-border hover:bg-muted/20 bg-amber-50/30">
                      <td className="px-3 py-2.5 font-medium">
                        {p.ingredients?.name ?? p.ingredient_id}
                        <span className="ml-1.5 text-[10px] font-sans text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">Extra</span>
                      </td>
                      <td className="px-3 py-2.5 text-right text-muted-foreground">—</td>
                      <td className="px-3 py-2.5 text-right text-muted-foreground">—</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{p.quantity.toFixed(3)} {p.unit}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums font-medium">{formatCurrency(p.total_cost)}</td>
                      <td className="px-3 py-2.5 text-right text-amber-600 text-xs">No estimado</td>
                      <td className="px-3 py-2.5 text-right">—</td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditPurchase(p)}>
                            <Pencil size={12} />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleDeletePurchase(p)}>
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}

                {/* Totals row */}
                {(requisitionItems.length > 0 || purchases.length > 0) && (
                  <tr className="border-t-2 border-border bg-muted/30 font-semibold">
                    <td className="px-3 py-2.5">Total insumos</td>
                    <td colSpan={2} className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                      {formatCurrency(requisitionItems.reduce((s, r) => s + r.total_cost, 0))}
                    </td>
                    <td className="px-3 py-2.5" />
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {formatCurrency(totalIngredientCost)}
                    </td>
                    <td className={`px-3 py-2.5 text-right tabular-nums ${
                      totalIngredientCost > requisitionItems.reduce((s, r) => s + r.total_cost, 0) ? "text-red-600" : "text-emerald-700"
                    }`}>
                      {(() => {
                        const estTotal = requisitionItems.reduce((s, r) => s + r.total_cost, 0)
                        const v = totalIngredientCost - estTotal
                        return `${v >= 0 ? "+" : ""}${formatCurrency(v)}`
                      })()}
                    </td>
                    <td colSpan={2} />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Recent purchases list (if any) */}
        {purchases.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-sans text-muted-foreground font-semibold uppercase tracking-wider">Registros individuales</p>
            {purchases.map((p) => (
              <div key={p.id} className="flex items-center gap-3 text-sm font-sans rounded px-3 py-2 hover:bg-muted/20">
                <span className="flex-1 font-medium">{p.ingredients?.name ?? "—"}</span>
                <span className="tabular-nums text-muted-foreground">{p.quantity.toFixed(3)} {p.unit} × {formatCurrency(p.unit_cost)}</span>
                <span className="tabular-nums font-medium">{formatCurrency(p.total_cost)}</span>
                <span className="text-muted-foreground text-xs">{formatDate(p.purchased_at)}</span>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditPurchase(p)}>
                    <Pencil size={12} />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => handleDeletePurchase(p)}>
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Indirect costs ────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-base font-semibold">Costos indirectos</h3>
          {availableCategories.length > 0 && (
            <Button size="sm" variant="outline" className="font-sans text-xs" onClick={openNewIndirect}>
              <Plus size={13} className="mr-1" /> Agregar costo
            </Button>
          )}
        </div>
        {indirectCosts.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-6 text-center">
            <p className="text-sm font-sans text-muted-foreground">
              Agrega costos indirectos para este evento (renta de equipo, logística, etc.)
            </p>
          </div>
        ) : (
          <div className="rounded-md border border-border overflow-hidden">
            {indirectCosts.map((ic, i) => (
              <div key={ic.id} className={`flex items-center gap-3 px-4 py-3 text-sm font-sans ${i > 0 ? "border-t border-border" : ""}`}>
                <div className="flex-1">
                  <p className="font-medium">{ic.indirect_cost_categories?.name ?? "—"}</p>
                  {ic.notes && <p className="text-xs text-muted-foreground">{ic.notes}</p>}
                </div>
                <span className="tabular-nums font-medium">{formatCurrency(ic.amount)}</span>
                <div className="flex gap-1 shrink-0">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditIndirect(ic)}>
                    <Pencil size={12} />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteIndirect(ic)}>
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── P&L summary ───────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <h3 className="font-heading text-base font-semibold">Estado de resultados</h3>
        <div className="rounded-lg border border-border p-4 space-y-2.5 max-w-sm">
          <div className="flex justify-between text-sm font-sans">
            <span className="text-muted-foreground">Ingresos (cotización)</span>
            <span className="tabular-nums font-medium">{formatCurrency(quoteTotal)}</span>
          </div>
          <div className="flex justify-between text-sm font-sans">
            <span className="text-muted-foreground">− Costo de insumos</span>
            <span className="tabular-nums text-red-700">{formatCurrency(totalIngredientCost)}</span>
          </div>
          <div className="flex justify-between text-sm font-sans">
            <span className="text-muted-foreground">− Costos indirectos</span>
            <span className="tabular-nums text-red-700">{formatCurrency(totalIndirectCost)}</span>
          </div>
          <div className="flex justify-between text-sm font-sans">
            <span className="text-muted-foreground">− Personal</span>
            <span className={`tabular-nums ${staffCost > 0 ? "text-red-700" : "text-muted-foreground"}`}>
              {staffCost > 0 ? formatCurrency(staffCost) : "—"}
            </span>
          </div>
          <Separator />
          <div className="flex justify-between font-sans font-semibold">
            <span>Utilidad estimada</span>
            <span className={`tabular-nums text-lg font-heading ${profit >= 0 ? "text-emerald-700" : "text-red-700"}`}>
              {formatCurrency(profit)}
            </span>
          </div>
          <div className="flex justify-between text-sm font-sans text-muted-foreground">
            <span>Margen</span>
            <span className={`tabular-nums font-medium ${margin >= 20 ? "text-emerald-700" : margin >= 10 ? "text-amber-700" : "text-red-700"}`}>
              {margin.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* ── Actual purchase dialog ────────────────────────────────────────── */}
      <Dialog open={purchaseOpen} onOpenChange={setPurchaseOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editingPurchase ? "Editar compra" : "Registrar compra"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {!editingPurchase && (
              <div className="space-y-1.5">
                <Label className="font-sans">Ingrediente *</Label>
                <Select
                  value={purchaseForm.ingredient_id}
                  onValueChange={(v) => {
                    const ri = requisitionItems.find((r) => r.ingredient_id === (v ?? ""))
                    setPurchaseForm((f) => ({
                      ...f,
                      ingredient_id: v ?? "",
                      unit: ri?.unit ?? f.unit,
                      quantity: ri ? String(ri.quantity) : f.quantity,
                      unit_cost: ri ? String(ri.unit_cost) : f.unit_cost,
                    }))
                  }}
                >
                  <SelectTrigger className="font-sans">
                    <SelectValue placeholder="Selecciona ingrediente" />
                  </SelectTrigger>
                  <SelectContent>
                    {requisitionItems.map((ri) => (
                      <SelectItem key={ri.ingredient_id} value={ri.ingredient_id} className="font-sans">
                        {ri.ingredients?.name ?? ri.ingredient_id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-sans">Cantidad *</Label>
                <Input
                  type="number" step="0.001" min="0"
                  value={purchaseForm.quantity}
                  onChange={(e) => setPurchaseForm((f) => ({ ...f, quantity: e.target.value }))}
                  placeholder="0.000"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-sans">Unidad</Label>
                <Input
                  value={purchaseForm.unit}
                  onChange={(e) => setPurchaseForm((f) => ({ ...f, unit: e.target.value }))}
                  placeholder="kg, lt, pza..."
                  disabled={!!editingPurchase}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-sans">Precio unitario *</Label>
                <Input
                  type="number" step="0.01" min="0"
                  value={purchaseForm.unit_cost}
                  onChange={(e) => setPurchaseForm((f) => ({ ...f, unit_cost: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-sans">Fecha compra</Label>
                <Input
                  type="date"
                  value={purchaseForm.purchased_at}
                  onChange={(e) => setPurchaseForm((f) => ({ ...f, purchased_at: e.target.value }))}
                />
              </div>
            </div>
            {purchaseForm.quantity && purchaseForm.unit_cost && (
              <p className="text-sm font-sans text-muted-foreground">
                Total: <span className="font-semibold text-foreground tabular-nums">
                  {formatCurrency(Number(purchaseForm.quantity) * Number(purchaseForm.unit_cost))}
                </span>
              </p>
            )}
            <div className="space-y-1.5">
              <Label className="font-sans">Notas</Label>
              <Input
                value={purchaseForm.notes}
                onChange={(e) => setPurchaseForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Proveedor, referencia..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPurchaseOpen(false)} className="font-sans">Cancelar</Button>
            <Button onClick={savePurchase} disabled={savingPurchase} className="bg-gold hover:bg-gold-dark text-ink font-sans font-medium">
              {savingPurchase ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Indirect cost dialog ──────────────────────────────────────────── */}
      <Dialog open={indirectOpen} onOpenChange={setIndirectOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editingIndirect ? "Editar costo indirecto" : "Agregar costo indirecto"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {!editingIndirect && (
              <div className="space-y-1.5">
                <Label className="font-sans">Categoría *</Label>
                <Select
                  value={indirectForm.category_id}
                  onValueChange={(v) => {
                    const suggested = suggestAmount(v ?? "")
                    setIndirectForm((f) => ({
                      ...f,
                      category_id: v ?? "",
                      amount: suggested > 0 ? String(suggested) : f.amount,
                    }))
                  }}
                >
                  <SelectTrigger className="font-sans">
                    <SelectValue placeholder="Selecciona categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id} className="font-sans">
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="font-sans">Monto (MXN) *</Label>
              <Input
                type="number" step="0.01" min="0"
                value={indirectForm.amount}
                onChange={(e) => setIndirectForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-sans">Notas</Label>
              <Input
                value={indirectForm.notes}
                onChange={(e) => setIndirectForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Detalles adicionales..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIndirectOpen(false)} className="font-sans">Cancelar</Button>
            <Button onClick={saveIndirect} disabled={savingIndirect} className="bg-gold hover:bg-gold-dark text-ink font-sans font-medium">
              {savingIndirect ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
