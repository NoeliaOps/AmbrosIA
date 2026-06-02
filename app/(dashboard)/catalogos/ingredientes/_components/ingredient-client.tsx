"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DataTable, type Column } from "@/components/tables/data-table"
import { EmptyState } from "@/components/ui/empty-state"
import { formatCurrency } from "@/lib/utils"
import { INGREDIENT_CATEGORIES, UNITS_OF_MEASURE } from "@/lib/constants"
import { createIngredient, updateIngredient, deleteIngredient, type IngredientFormData } from "../actions"

type Supplier = { id: string; name: string }

type Ingredient = {
  id: string
  name: string
  unit: string
  category: string | null
  current_price: number
  preferred_supplier_id: string | null
  notes: string | null
  suppliers: { name: string } | null
}

const schema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  unit: z.string().min(1, "La unidad es requerida"),
  category: z.string().optional(),
  current_price: z.number().min(0, "El precio debe ser positivo"),
  preferred_supplier_id: z.string().optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

type Props = {
  ingredients: Ingredient[]
  suppliers: Supplier[]
}

export function IngredientClient({ ingredients: initial, suppliers }: Props) {
  const [ingredients, setIngredients] = useState(initial)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Ingredient | null>(null)
  const [deleting, setDeleting] = useState<Ingredient | null>(null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { current_price: 0 },
  })

  function openCreate() {
    setEditing(null)
    reset({ current_price: 0 })
    setOpen(true)
  }

  function openEdit(item: Ingredient) {
    setEditing(item)
    reset({
      name: item.name,
      unit: item.unit,
      category: item.category ?? "",
      current_price: item.current_price,
      preferred_supplier_id: item.preferred_supplier_id ?? "",
      notes: item.notes ?? "",
    })
    setOpen(true)
  }

  async function onSubmit(data: FormValues) {
    setLoading(true)
    const payload: IngredientFormData = {
      name: data.name,
      unit: data.unit,
      category: data.category || undefined,
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

  const columns: Column<Ingredient>[] = [
    { key: "name", header: "Ingrediente", sortable: true,
      cell: (row) => <span className="font-medium">{row.name}</span> },
    { key: "category", header: "Categoría",
      cell: (row) => row.category
        ? <Badge variant="secondary" className="font-sans text-xs">{row.category}</Badge>
        : "—" },
    { key: "unit", header: "Unidad",
      cell: (row) => <span className="text-muted-foreground">{row.unit}</span> },
    { key: "current_price", header: "Precio actual", sortable: true,
      cell: (row) => <span className="font-medium tabular-nums">{formatCurrency(row.current_price)}</span> },
    { key: "suppliers", header: "Proveedor preferido",
      cell: (row) => row.suppliers?.name ?? "—" },
    { key: "actions", header: "", className: "w-20 text-right",
      cell: (row) => (
        <div className="flex justify-end gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(row)}>
            <Pencil size={14} />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleting(row)}>
            <Trash2 size={14} />
          </Button>
        </div>
      )},
  ]

  const watchUnit = watch("unit")
  const watchCategory = watch("category")
  const watchSupplier = watch("preferred_supplier_id")

  return (
    <>
      <DataTable
        data={ingredients}
        columns={columns}
        searchPlaceholder="Buscar ingrediente..."
        searchKeys={["name", "category"] as (keyof Ingredient)[]}
        actions={
          <Button onClick={openCreate} className="bg-gold hover:bg-gold-dark text-ink font-sans font-medium">
            <Plus size={16} className="mr-1" /> Nuevo ingrediente
          </Button>
        }
        emptyState={
          <EmptyState
            icon={Package}
            title="Sin ingredientes"
            description="Agrega los ingredientes de tu catálogo para comenzar."
            action={{ label: "Agregar ingrediente", onClick: openCreate }}
          />
        }
      />

      {/* Create / Edit */}
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
                <Label className="font-sans">Unidad de medida *</Label>
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

              <div className="space-y-1.5">
                <Label className="font-sans">Precio actual (MXN) *</Label>
                <Input {...register("current_price", { valueAsNumber: true })} type="number" step="0.01" min="0" placeholder="0.00" />
                {errors.current_price && <p className="text-xs text-destructive">{errors.current_price.message}</p>}
              </div>

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
                <Textarea {...register("notes")} placeholder="Especificaciones, presentación, etc." rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="font-sans">Cancelar</Button>
              <Button type="submit" disabled={loading} className="bg-gold hover:bg-gold-dark text-ink font-sans font-medium">
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
    </>
  )
}
