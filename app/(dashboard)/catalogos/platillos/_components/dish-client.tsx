"use client"

import { useMemo, useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, UtensilsCrossed, X, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { EmptyState } from "@/components/ui/empty-state"
import { formatCurrency } from "@/lib/utils"
import { DISH_CATEGORIES } from "@/lib/constants"
import { createDish, updateDish, deleteDish, type DishFormData } from "../actions"

// Identidad del módulo Platillos (Recetas → brass)
const ACCENT = "#8B6D24"

type Ingredient = { id: string; name: string; unit: string; current_price: number }

type RecipeItem = {
  id: string
  ingredient_id: string
  quantity: number
  notes: string | null
  ingredients: { name: string; unit: string; current_price: number } | null
}

type Dish = {
  id: string
  name: string
  category: string | null
  servings_yield: number
  notes: string | null
  recipe_items: RecipeItem[]
}

const recipeItemSchema = z.object({
  ingredient_id: z.string().min(1, "Selecciona un ingrediente"),
  quantity: z.number().positive("Cantidad requerida"),
  notes: z.string().optional(),
})

const schema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  category: z.string().optional(),
  servings_yield: z.number().int().positive("El rendimiento debe ser mayor a 0"),
  notes: z.string().optional(),
  recipe: z.array(recipeItemSchema),
})

type FormValues = z.infer<typeof schema>

type Props = { dishes: Dish[]; ingredients: Ingredient[] }

export function DishClient({ dishes: initial, ingredients }: Props) {
  const [dishes, setDishes] = useState(initial)
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Dish | null>(null)
  const [deleting, setDeleting] = useState<Dish | null>(null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, reset, setValue, watch, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { servings_yield: 1, recipe: [] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: "recipe" })

  const watchCategory = watch("category")
  const watchRecipe = watch("recipe")

  function openCreate() {
    setEditing(null)
    reset({ servings_yield: 1, recipe: [] })
    setOpen(true)
  }

  function openEdit(dish: Dish) {
    setEditing(dish)
    reset({
      name: dish.name,
      category: dish.category ?? "",
      servings_yield: dish.servings_yield,
      notes: dish.notes ?? "",
      recipe: dish.recipe_items.map((r) => ({
        ingredient_id: r.ingredient_id,
        quantity: r.quantity,
        notes: r.notes ?? "",
      })),
    })
    setOpen(true)
  }

  // Estimated cost per serving
  const estimatedCost = watchRecipe.reduce((sum, item) => {
    const ing = ingredients.find((i) => i.id === item.ingredient_id)
    if (!ing || !item.quantity) return sum
    return sum + ing.current_price * Number(item.quantity)
  }, 0)

  async function onSubmit(data: FormValues) {
    setLoading(true)
    const payload: DishFormData = {
      name: data.name,
      category: data.category || undefined,
      servings_yield: data.servings_yield,
      notes: data.notes || undefined,
      recipe: data.recipe.map((r) => ({
        ingredient_id: r.ingredient_id,
        quantity: r.quantity,
        notes: r.notes || undefined,
      })),
    }

    if (editing) {
      const { error } = await updateDish(editing.id, payload)
      if (error) { toast.error(error); setLoading(false); return }
      toast.success("Platillo actualizado")
    } else {
      const { error } = await createDish(payload)
      if (error) { toast.error(error); setLoading(false); return }
      toast.success("Platillo creado")
    }
    // Refresh: reload page state via router would be ideal, but re-fetch simplified here
    setOpen(false)
    setLoading(false)
    window.location.reload()
  }

  async function confirmDelete() {
    if (!deleting) return
    setLoading(true)
    const { error } = await deleteDish(deleting.id)
    if (error) { toast.error(error); setLoading(false); return }
    setDishes((prev) => prev.filter((d) => d.id !== deleting.id))
    toast.success("Platillo eliminado")
    setDeleting(null)
    setLoading(false)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return dishes
    return dishes.filter((d) =>
      d.name.toLowerCase().includes(q) || (d.category ?? "").toLowerCase().includes(q)
    )
  }, [dishes, query])

  return (
    <>
      {/* Barra: búsqueda + nuevo */}
      <div className="flex items-center gap-3 flex-wrap justify-between">
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar platillo o categoría…"
            className="pl-9 h-9 font-sans"
          />
        </div>
        <Button onClick={openCreate} className="bg-[#2D2926] hover:bg-[#1A1714] text-white font-sans font-medium">
          <Plus size={16} className="mr-1" /> Nuevo platillo
        </Button>
      </div>

      {dishes.length === 0 ? (
        <EmptyState icon={UtensilsCrossed} title="Sin platillos"
          description="Agrega los platillos de tu catálogo con sus recetas."
          action={{ label: "Agregar platillo", onClick: openCreate }} />
      ) : filtered.length === 0 ? (
        <div className="enterprise-card py-12 text-center">
          <p className="text-sm font-sans text-muted-foreground">Ningún platillo coincide con “{query}”.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 stagger-children">
          {filtered.map((dish) => (
            <RecipeCard
              key={dish.id}
              dish={dish}
              onEdit={() => openEdit(dish)}
              onDelete={() => setDeleting(dish)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">{editing ? "Editar platillo" : "Nuevo platillo"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Basic info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="font-sans">Nombre *</Label>
                <Input {...register("name")} placeholder="Ej. Filete de res al mole" />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="font-sans">Rinde (porciones) *</Label>
                <Input {...register("servings_yield", { valueAsNumber: true })} type="number" min="1" placeholder="1" />
                {errors.servings_yield && <p className="text-xs text-destructive">{errors.servings_yield.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="font-sans">Categoría</Label>
                <Select value={watchCategory} onValueChange={(v) => setValue("category", v ?? "")}>
                  <SelectTrigger className="font-sans"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                  <SelectContent>
                    {DISH_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c} className="font-sans">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="font-sans">Notas</Label>
                <Textarea {...register("notes")} placeholder="Temperatura, presentación, alergenos, etc." rows={2} />
              </div>
            </div>

            <Separator />

            {/* Recipe editor */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-heading text-sm font-semibold">Receta</h4>
                  <p className="text-xs text-muted-foreground font-sans">Cantidades por porción</p>
                </div>
                {fields.length > 0 && (
                  <p className="text-xs font-sans text-muted-foreground">
                    Costo estimado / porción:{" "}
                    <span className="font-semibold text-foreground tabular-nums">{formatCurrency(estimatedCost / (watch("servings_yield") || 1))}</span>
                  </p>
                )}
              </div>

              {fields.length > 0 && (
                <div className="rounded-md border border-border overflow-hidden">
                  <div className="grid grid-cols-[1fr_120px_24px] gap-2 px-3 py-2 bg-muted/40 text-xs font-sans font-semibold uppercase tracking-wider text-muted-foreground">
                    <span>Ingrediente</span><span>Cantidad</span><span />
                  </div>
                  {fields.map((field, index) => {
                    const ing = ingredients.find((i) => i.id === watchRecipe[index]?.ingredient_id)
                    return (
                      <div key={field.id} className="grid grid-cols-[1fr_120px_24px] gap-2 px-3 py-2 border-t border-border items-center">
                        <Select
                          value={watchRecipe[index]?.ingredient_id}
                          onValueChange={(v) => setValue(`recipe.${index}.ingredient_id`, v ?? "")}
                        >
                          <SelectTrigger className="font-sans h-8 text-sm">
                            <SelectValue placeholder="Ingrediente" />
                          </SelectTrigger>
                          <SelectContent>
                            {ingredients.map((i) => (
                              <SelectItem key={i.id} value={i.id} className="font-sans text-sm">
                                {i.name} <span className="text-muted-foreground">({i.unit})</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-1">
                          <Input
                            {...register(`recipe.${index}.quantity`, { valueAsNumber: true })}
                            type="number" step="0.0001" min="0.0001"
                            placeholder="0"
                            className="h-8 text-sm font-sans"
                          />
                          {ing && <span className="text-xs text-muted-foreground whitespace-nowrap">{ing.unit}</span>}
                        </div>
                        <button type="button" onClick={() => remove(index)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <X size={14} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="font-sans"
                onClick={() => append({ ingredient_id: "", quantity: 0 })}
              >
                <Plus size={14} className="mr-1" /> Agregar ingrediente
              </Button>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="font-sans">Cancelar</Button>
              <Button type="submit" disabled={loading} className="bg-[#2D2926] hover:bg-[#1A1714] text-white font-sans font-medium">
                {loading ? "Guardando…" : editing ? "Guardar cambios" : "Crear platillo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-heading">Eliminar platillo</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground font-sans">
            ¿Eliminar <strong>{deleting?.name}</strong>? Su receta también se eliminará.
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

// Paleta para los segmentos de composición de costo (apagada, armónica)
const SEGMENT_COLORS = ["#8B6D24", "#5F6B2F", "#9A5B3F", "#4A5568", "#6B4C6B", "#2C6E6A", "#6B4A2F", "#8A3F4D"]

function RecipeCard({ dish, onEdit, onDelete }: { dish: Dish; onEdit: () => void; onDelete: () => void }) {
  const lines = dish.recipe_items
    .map((r) => ({
      name: r.ingredients?.name ?? "—",
      unit: r.ingredients?.unit ?? "",
      price: r.ingredients?.current_price ?? 0,
      quantity: r.quantity,
      cost: (r.ingredients?.current_price ?? 0) * r.quantity,
    }))
    .sort((a, b) => b.cost - a.cost)

  const total = lines.reduce((s, l) => s + l.cost, 0)
  const perServing = total / (dish.servings_yield || 1)

  return (
    <div className="enterprise-card p-4 flex flex-col gap-3 group">
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "1.1rem", fontWeight: 600, color: "var(--text-1)", letterSpacing: "-0.01em", lineHeight: 1.2 }} className="truncate">
            {dish.name}
          </h3>
          <p className="mt-0.5 flex items-center gap-1.5 flex-wrap" style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", color: "var(--text-3)" }}>
            {dish.category && (
              <span style={{ color: ACCENT, fontWeight: 600 }}>{dish.category}</span>
            )}
            {dish.category && <span>·</span>}
            <span>rinde {dish.servings_yield} porción{dish.servings_yield !== 1 ? "es" : ""}</span>
            <span>·</span>
            <span>{lines.length} ingrediente{lines.length !== 1 ? "s" : ""}</span>
          </p>
        </div>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit}><Pencil size={14} /></Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onDelete}><Trash2 size={14} /></Button>
        </div>
      </div>

      {/* Barra de composición del costo */}
      {total > 0 && (
        <div className="flex h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--surface-3, #EBEBEC)" }}>
          {lines.map((l, i) => (
            <div key={i} style={{ width: `${(l.cost / total) * 100}%`, background: SEGMENT_COLORS[i % SEGMENT_COLORS.length] }} />
          ))}
        </div>
      )}

      {/* Lista de ingredientes con precio actual y costo de línea */}
      {lines.length > 0 ? (
        <div className="space-y-1">
          {lines.map((l, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="h-2 w-2 rounded-sm shrink-0" style={{ background: SEGMENT_COLORS[i % SEGMENT_COLORS.length] }} />
              <span className="font-sans truncate flex-1" style={{ color: "var(--text-1)" }}>{l.name}</span>
              <span className="mono-data shrink-0" style={{ fontSize: "0.7rem", color: "var(--text-3)" }}>
                {l.quantity} {l.unit} × {formatCurrency(l.price)}
              </span>
              <span className="mono-data shrink-0 text-right" style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-1)", width: "4.5rem" }}>
                {formatCurrency(l.cost)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs font-sans text-muted-foreground italic">Sin receta — agrega ingredientes para calcular el costo.</p>
      )}

      {/* Totales */}
      <div className="mt-auto pt-3 flex items-end justify-between" style={{ borderTop: "1px solid var(--border-def, #EBEBEC)" }}>
        <div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)" }}>Costo receta</p>
          <p className="mono-data" style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-2)" }}>{formatCurrency(total)}</p>
        </div>
        <div className="text-right">
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)" }}>Costo / porción</p>
          <p className="mono-data" style={{ fontSize: "1.25rem", fontWeight: 700, color: ACCENT, lineHeight: 1.1 }}>{formatCurrency(perServing)}</p>
        </div>
      </div>
    </div>
  )
}
