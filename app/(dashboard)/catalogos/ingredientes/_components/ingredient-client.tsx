"use client"

import { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Package, AlertTriangle, CheckCircle2, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DataTable, type Column } from "@/components/tables/data-table"
import { EmptyState } from "@/components/ui/empty-state"
import { formatCurrency } from "@/lib/utils"
import { basePriceFrom } from "@/lib/units"
import { INGREDIENT_CATEGORIES, UNITS_OF_MEASURE } from "@/lib/constants"
import { createIngredient, updateIngredient, deleteIngredient, type IngredientFormData } from "../actions"
import { updatePurchaseUnit } from "../purchase-unit-actions"
import { PurchaseUnitsDialog, type PurchaseUnit } from "./purchase-units-dialog"

type Supplier = { id: string; name: string }

type Ingredient = {
  id: string
  name: string
  unit: string
  category: string | null
  current_price: number
  preferred_supplier_id: string | null
  notes: string | null
  updated_at: string
  suppliers: { name: string } | null
  ingredient_purchase_units: PurchaseUnit[]
}

// ── Price freshness ─────────────────────────────────────────────────────────

function daysSince(isoDate: string): number {
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / 86_400_000)
}

function PriceFreshness({ updatedAt }: { updatedAt: string }) {
  const days = daysSince(updatedAt)
  if (days < 14) return (
    <span className="flex items-center gap-1" style={{ color: "var(--status-active)", fontFamily: "var(--font-mono)", fontSize: "0.65rem" }}>
      <CheckCircle2 size={10} />
      hace {days === 0 ? "hoy" : `${days}d`}
    </span>
  )
  if (days < 30) return (
    <span className="flex items-center gap-1" style={{ color: "var(--amber)", fontFamily: "var(--font-mono)", fontSize: "0.65rem" }}>
      <AlertTriangle size={10} />
      hace {days}d
    </span>
  )
  return (
    <span className="flex items-center gap-1" style={{ color: "var(--status-danger)", fontFamily: "var(--font-mono)", fontSize: "0.65rem" }}>
      <AlertTriangle size={10} />
      hace {days}d
    </span>
  )
}

// ── Inline price cell ────────────────────────────────────────────────────────

function defaultUnit(ing: Ingredient): PurchaseUnit | null {
  const units = ing.ingredient_purchase_units ?? []
  return units.find((u) => u.is_default) ?? units[0] ?? null
}

function PriceCell({
  ingredient,
  onSaved,
}: {
  ingredient: Ingredient
  onSaved: (id: string, units: PurchaseUnit[], basePrice: number, updatedAt: string) => void
}) {
  const def = defaultUnit(ingredient)
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(String(def?.price ?? ingredient.current_price))
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function startEdit() {
    if (!def) return
    setValue(String(def.price))
    setEditing(true)
    setTimeout(() => { inputRef.current?.select() }, 0)
  }

  async function save() {
    if (!def) { setEditing(false); return }
    const newPrice = parseFloat(value)
    if (isNaN(newPrice) || newPrice < 0 || newPrice === def.price) { setEditing(false); return }
    setSaving(true)
    const { data, error } = await updatePurchaseUnit(def.id, ingredient.id, {
      unit: def.unit, factor: def.factor, price: newPrice, supplier_id: def.supplier_id, whole_units: def.whole_units, is_default: true,
    })
    setSaving(false)
    if (error || !data) { toast.error(error ?? "Error"); setEditing(false); return }
    const row = data as unknown as PurchaseUnit
    const units = (ingredient.ingredient_purchase_units ?? []).map((u) => u.id === row.id ? row : u)
    toast.success("Precio actualizado")
    setEditing(false)
    onSaved(ingredient.id, units, basePriceFrom(row), new Date().toISOString())
  }

  if (editing && def) {
    return (
      <input
        ref={inputRef} type="number" step="0.01" min="0" value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); save() } if (e.key === "Escape") setEditing(false) }}
        disabled={saving}
        style={{ width: "7rem", fontFamily: "var(--font-mono)", fontSize: "0.8125rem", fontWeight: 600, color: "var(--amber)", background: "var(--surface-2)", border: "1px solid var(--amber)", borderRadius: "4px", padding: "0.2rem 0.4rem", outline: "none" }}
      />
    )
  }

  return (
    <button onClick={startEdit} title="Click para editar el precio de la presentación predeterminada"
      className="group flex flex-col items-start rounded px-1 -ml-1 transition-colors hover:bg-amber-glow" style={{ cursor: "text" }}>
      <span className="flex items-center gap-1.5">
        <span className="mono-data" style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-1)" }}>
          {formatCurrency(def?.price ?? ingredient.current_price)}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text-3)" }}>/ {def?.unit ?? ingredient.unit}</span>
        <Pencil size={10} className="opacity-0 group-hover:opacity-40 transition-opacity" style={{ color: "var(--amber)" }} />
      </span>
      {def && def.factor !== 1 && (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "var(--text-3)" }}>
          = {formatCurrency(basePriceFrom(def))}/{ingredient.unit}
        </span>
      )}
    </button>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  unit: z.string().min(1, "La unidad es requerida"),
  category: z.string().optional(),
  current_price: z.number().min(0, "El precio debe ser positivo"),
  preferred_supplier_id: z.string().optional(),
  notes: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

type Props = { ingredients: Ingredient[]; suppliers: Supplier[] }

export function IngredientClient({ ingredients: initial, suppliers }: Props) {
  const [ingredients, setIngredients] = useState(initial)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Ingredient | null>(null)
  const [deleting, setDeleting] = useState<Ingredient | null>(null)
  const [puIngredient, setPuIngredient] = useState<Ingredient | null>(null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { current_price: 0 },
  })

  function handlePriceSaved(id: string, units: PurchaseUnit[], basePrice: number, updatedAt: string) {
    setIngredients((prev) =>
      prev.map((i) => i.id === id ? { ...i, ingredient_purchase_units: units, current_price: basePrice, updated_at: updatedAt } : i)
    )
  }

  function handleUnitsChanged(id: string, units: PurchaseUnit[], basePrice: number) {
    setIngredients((prev) =>
      prev.map((i) => i.id === id ? { ...i, ingredient_purchase_units: units, current_price: basePrice, updated_at: new Date().toISOString() } : i)
    )
    setPuIngredient((prev) => prev && prev.id === id ? { ...prev, ingredient_purchase_units: units, current_price: basePrice } : prev)
  }

  function openCreate() { setEditing(null); reset({ current_price: 0 }); setOpen(true) }
  function openEdit(item: Ingredient) {
    setEditing(item)
    reset({
      name: item.name, unit: item.unit, category: item.category ?? "",
      current_price: item.current_price, preferred_supplier_id: item.preferred_supplier_id ?? "",
      notes: item.notes ?? "",
    })
    setOpen(true)
  }

  async function onSubmit(data: FormValues) {
    setLoading(true)
    const payload: IngredientFormData = {
      name: data.name, unit: data.unit, category: data.category || undefined,
      current_price: data.current_price,
      preferred_supplier_id: data.preferred_supplier_id || null,
      notes: data.notes || undefined,
    }
    if (editing) {
      const { data: updated, error } = await updateIngredient(editing.id, payload, editing.current_price)
      if (error) { toast.error(error); setLoading(false); return }
      setIngredients((prev) => prev.map((i) => i.id === editing.id ? { ...i, ...(updated ?? {}) as Partial<Ingredient> } : i))
      toast.success("Ingrediente actualizado")
    } else {
      const { data: created, error } = await createIngredient(payload)
      if (error) { toast.error(error); setLoading(false); return }
      setIngredients((prev) => [...prev, created as unknown as Ingredient])
      toast.success("Ingrediente creado")
    }
    setOpen(false)
    setLoading(false)
  }

  async function confirmDelete() {
    if (!deleting) return
    setLoading(true)
    const { error } = await deleteIngredient(deleting.id)
    if (error) { toast.error(error); setLoading(false); return }
    setIngredients((prev) => prev.filter((i) => i.id !== deleting.id))
    toast.success("Ingrediente eliminado")
    setDeleting(null)
    setLoading(false)
  }

  // Stale count for header hint
  const staleCount = ingredients.filter((i) => daysSince(i.updated_at) >= 30).length

  const columns: Column<Ingredient>[] = [
    { key: "name", header: "Ingrediente", sortable: true,
      cell: (row) => (
        <div>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.875rem", fontWeight: 500, color: "var(--text-1)" }}>{row.name}</p>
          {row.category && (
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: "0.1rem" }}>{row.category}</p>
          )}
        </div>
      )},
    { key: "unit", header: "Unidad",
      cell: (row) => <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-2)" }}>{row.unit}</span> },
    { key: "current_price", header: "Precio actual", sortable: true,
      cell: (row) => <PriceCell ingredient={row} onSaved={handlePriceSaved} /> },
    { key: "updated_at", header: "Actualizado", sortable: true,
      cell: (row) => <PriceFreshness updatedAt={row.updated_at} /> },
    { key: "suppliers", header: "Proveedor",
      cell: (row) => <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.75rem", color: "var(--text-2)" }}>{row.suppliers?.name ?? "—"}</span> },
    { key: "purchase_units", header: "Compra",
      cell: (row) => {
        const n = (row.ingredient_purchase_units ?? []).length
        return (
          <Button size="sm" variant="outline" className="h-7 text-xs font-sans gap-1" onClick={() => setPuIngredient(row)}>
            <Layers size={12} /> {n} present.
          </Button>
        )
      }},
    { key: "actions", header: "", className: "w-20 text-right",
      cell: (row) => (
        <div className="flex justify-end gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(row)}>
            <Pencil size={13} />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleting(row)}>
            <Trash2 size={13} />
          </Button>
        </div>
      )},
  ]

  const watchUnit = watch("unit")
  const watchCategory = watch("category")
  const watchSupplier = watch("preferred_supplier_id")

  return (
    <>
      {staleCount > 0 && (
        <div className="alert-banner flex items-center gap-3" style={{ borderLeftColor: "var(--status-danger)" }}>
          <AlertTriangle size={14} className="shrink-0" style={{ color: "var(--status-danger)" }} />
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.8125rem", color: "var(--text-1)" }}>
            <strong>{staleCount} ingrediente{staleCount !== 1 ? "s" : ""}</strong> con precio sin actualizar hace más de 30 días.
            <span style={{ color: "var(--text-2)", marginLeft: "0.375rem" }}>Haz click en el precio para editarlo directamente.</span>
          </p>
        </div>
      )}

      <DataTable
        data={ingredients}
        columns={columns}
        searchPlaceholder="Buscar ingrediente o categoría..."
        searchKeys={["name", "category"] as (keyof Ingredient)[]}
        actions={
          <Button onClick={openCreate} className="bg-[#2D2926] hover:bg-[#1A1714] text-white font-sans font-medium">
            <Plus size={16} className="mr-1" /> Nuevo ingrediente
          </Button>
        }
        emptyState={
          <EmptyState
            icon={Package}
            title="Sin ingredientes"
            description="Agrega los ingredientes de tu catálogo para comenzar a calcular costos de recetas."
            action={{ label: "Agregar ingrediente", onClick: openCreate }}
          />
        }
      />

      {/* Create / Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">{editing ? "Editar ingrediente" : "Nuevo ingrediente"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="font-sans">Nombre *</Label>
                <Input {...register("name")} placeholder="Ej. Pechuga de pollo" />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="font-sans">Unidad base / de receta *</Label>
                <Select value={watchUnit} onValueChange={(v) => setValue("unit", v ?? "")}>
                  <SelectTrigger className="font-sans"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                  <SelectContent>
                    {UNITS_OF_MEASURE.map((u) => (
                      <SelectItem key={u} value={u} className="font-sans">{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.unit && <p className="text-xs text-destructive">{errors.unit.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="font-sans">Categoría</Label>
                <Select value={watchCategory} onValueChange={(v) => setValue("category", v ?? "")}>
                  <SelectTrigger className="font-sans"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                  <SelectContent>
                    {INGREDIENT_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c} className="font-sans">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!editing ? (
                <div className="space-y-1.5">
                  <Label className="font-sans">Precio inicial (MXN / unidad base) *</Label>
                  <Input {...register("current_price", { valueAsNumber: true })} type="number" step="0.01" min="0" placeholder="0.00" />
                  {errors.current_price && <p className="text-xs text-destructive">{errors.current_price.message}</p>}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label className="font-sans">Precio</Label>
                  <p className="text-xs font-sans text-muted-foreground pt-2">Se gestiona en <strong>Presentaciones de compra</strong> (columna “Compra”).</p>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="font-sans">Proveedor preferido</Label>
                <Select value={watchSupplier} onValueChange={(v) => setValue("preferred_supplier_id", v ?? "")}>
                  <SelectTrigger className="font-sans"><SelectValue placeholder="Sin proveedor" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="" className="font-sans">Sin proveedor</SelectItem>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="font-sans">{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label className="font-sans">Notas</Label>
                <Textarea {...register("notes")} placeholder="Especificaciones, presentación, marca, etc." rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="font-sans">Cancelar</Button>
              <Button type="submit" disabled={loading} className="bg-[#2D2926] hover:bg-[#1A1714] text-white font-sans font-medium">
                {loading ? "Guardando…" : editing ? "Guardar cambios" : "Crear ingrediente"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Eliminar ingrediente</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground font-sans">
            ¿Eliminar <strong>{deleting?.name}</strong>? Si está en alguna receta, esas referencias se perderán.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} className="font-sans">Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={loading} className="font-sans">
              {loading ? "Eliminando…" : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Presentaciones de compra */}
      {puIngredient && (
        <PurchaseUnitsDialog
          key={puIngredient.id}
          open={!!puIngredient}
          onOpenChange={(o) => !o && setPuIngredient(null)}
          ingredient={{ id: puIngredient.id, name: puIngredient.name, unit: puIngredient.unit }}
          units={puIngredient.ingredient_purchase_units ?? []}
          suppliers={suppliers}
          onChange={(units, basePrice) => handleUnitsChanged(puIngredient.id, units, basePrice)}
        />
      )}
    </>
  )
}
