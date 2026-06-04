"use client"

import { useMemo, useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, BookOpen, X, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { EmptyState } from "@/components/ui/empty-state"
import { formatCurrency } from "@/lib/utils"
import { EVENT_TYPES } from "@/lib/constants"
import { createMenu, updateMenu, deleteMenu, type MenuFormData } from "../actions"

// Identidad del módulo Menús (Recetas → ciruela)
const ACCENT = "#6B4C6B"

type Dish = {
  id: string
  name: string
  category: string | null
  servings_yield: number
  recipe_items: { quantity: number; ingredients: { current_price: number } | null }[]
}

type MenuDish = {
  id: string
  dish_id: string
  servings: number
  notes: string | null
  dishes: { name: string; category: string | null; servings_yield: number; recipe_items: { quantity: number; ingredients: { current_price: number } | null }[] } | null
}

type Menu = {
  id: string
  name: string
  event_type: string | null
  notes: string | null
  menu_dishes: MenuDish[]
}

const menuDishSchema = z.object({
  dish_id: z.string().min(1, "Selecciona un platillo"),
  servings: z.number().int().positive("Porciones requeridas"),
  notes: z.string().optional(),
})

const schema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  event_type: z.string().optional(),
  notes: z.string().optional(),
  dishes: z.array(menuDishSchema),
})

type FormValues = z.infer<typeof schema>

type Props = { menus: Menu[]; dishes: Dish[] }

export function MenuClient({ menus: initial, dishes }: Props) {
  const [menus, setMenus] = useState(initial)
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Menu | null>(null)
  const [deleting, setDeleting] = useState<Menu | null>(null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, reset, setValue, watch, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { dishes: [] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: "dishes" })
  const watchEventType = watch("event_type")
  const watchDishes = watch("dishes")

  function openCreate() {
    setEditing(null)
    reset({ dishes: [] })
    setOpen(true)
  }

  function openEdit(menu: Menu) {
    setEditing(menu)
    reset({
      name: menu.name,
      event_type: menu.event_type ?? "",
      notes: menu.notes ?? "",
      dishes: menu.menu_dishes.map((d) => ({
        dish_id: d.dish_id,
        servings: d.servings,
        notes: d.notes ?? "",
      })),
    })
    setOpen(true)
  }

  function dishCostPerServing(dish: Dish) {
    const total = dish.recipe_items.reduce((s, r) => {
      return s + (r.ingredients?.current_price ?? 0) * r.quantity
    }, 0)
    return dish.servings_yield > 0 ? total / dish.servings_yield : 0
  }

  const menuEstimatedCost = watchDishes.reduce((sum, item) => {
    const dish = dishes.find((d) => d.id === item.dish_id)
    if (!dish || !item.servings) return sum
    return sum + dishCostPerServing(dish) * Number(item.servings)
  }, 0)

  async function onSubmit(data: FormValues) {
    setLoading(true)
    const payload: MenuFormData = {
      name: data.name,
      event_type: data.event_type || undefined,
      notes: data.notes || undefined,
      dishes: data.dishes.map((d) => ({
        dish_id: d.dish_id,
        servings: d.servings,
        notes: d.notes || undefined,
      })),
    }

    if (editing) {
      const { error } = await updateMenu(editing.id, payload)
      if (error) { toast.error(error); setLoading(false); return }
      toast.success("Menú actualizado")
    } else {
      const { error } = await createMenu(payload)
      if (error) { toast.error(error); setLoading(false); return }
      toast.success("Menú creado")
    }
    setOpen(false)
    setLoading(false)
    window.location.reload()
  }

  async function confirmDelete() {
    if (!deleting) return
    setLoading(true)
    const { error } = await deleteMenu(deleting.id)
    if (error) { toast.error(error); setLoading(false); return }
    setMenus((prev) => prev.filter((m) => m.id !== deleting.id))
    toast.success("Menú eliminado")
    setDeleting(null)
    setLoading(false)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return menus
    return menus.filter((m) => m.name.toLowerCase().includes(q) || (m.event_type ?? "").toLowerCase().includes(q))
  }, [menus, query])

  return (
    <>
      <div className="flex items-center gap-3 flex-wrap justify-between">
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar menú o tipo de evento…" className="pl-9 h-9 font-sans" />
        </div>
        <Button onClick={openCreate} className="bg-[#2D2926] hover:bg-[#1A1714] text-white font-sans font-medium">
          <Plus size={16} className="mr-1" /> Nuevo menú
        </Button>
      </div>

      {menus.length === 0 ? (
        <EmptyState icon={BookOpen} title="Sin menús"
          description="Crea menús combinando platillos de tu catálogo."
          action={{ label: "Crear menú", onClick: openCreate }} />
      ) : filtered.length === 0 ? (
        <div className="enterprise-card py-12 text-center">
          <p className="text-sm font-sans text-muted-foreground">Ningún menú coincide con “{query}”.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 stagger-children">
          {filtered.map((menu) => (
            <MenuCard key={menu.id} menu={menu} onEdit={() => openEdit(menu)} onDelete={() => setDeleting(menu)} />
          ))}
        </div>
      )}

      {/* Create / Edit */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">{editing ? "Editar menú" : "Nuevo menú"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="font-sans">Nombre *</Label>
                <Input {...register("name")} placeholder="Ej. Menú Boda Clásica" />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="font-sans">Tipo de evento</Label>
                <Select value={watchEventType} onValueChange={(v) => setValue("event_type", v ?? "")}>
                  <SelectTrigger className="font-sans"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((t) => (
                      <SelectItem key={t} value={t} className="font-sans">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="font-sans">Notas</Label>
                <Textarea {...register("notes")} placeholder="Restricciones, presentación, etc." rows={2} />
              </div>
            </div>

            <Separator />

            {/* Dish list editor */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-heading text-sm font-semibold">Platillos del menú</h4>
                  <p className="text-xs text-muted-foreground font-sans">Platillo + porciones a servir</p>
                </div>
                {fields.length > 0 && (
                  <p className="text-xs font-sans text-muted-foreground">
                    Costo estimado:{" "}
                    <span className="font-semibold text-foreground tabular-nums">{formatCurrency(menuEstimatedCost)}</span>
                  </p>
                )}
              </div>

              {fields.length > 0 && (
                <div className="rounded-md border border-border overflow-hidden">
                  <div className="grid grid-cols-[1fr_100px_24px] gap-2 px-3 py-2 bg-muted/40 text-xs font-sans font-semibold uppercase tracking-wider text-muted-foreground">
                    <span>Platillo</span><span>Porciones</span><span />
                  </div>
                  {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-[1fr_100px_24px] gap-2 px-3 py-2 border-t border-border items-center">
                      <Select
                        value={watchDishes[index]?.dish_id}
                        onValueChange={(v) => setValue(`dishes.${index}.dish_id`, v ?? "")}
                      >
                        <SelectTrigger className="font-sans h-8 text-sm">
                          <SelectValue placeholder="Platillo" />
                        </SelectTrigger>
                        <SelectContent>
                          {dishes.map((d) => (
                            <SelectItem key={d.id} value={d.id} className="font-sans text-sm">
                              {d.name}
                              {d.category && <span className="text-muted-foreground"> · {d.category}</span>}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        {...register(`dishes.${index}.servings`, { valueAsNumber: true })}
                        type="number" min="1" placeholder="0"
                        className="h-8 text-sm font-sans"
                      />
                      <button type="button" onClick={() => remove(index)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <Button
                type="button" variant="outline" size="sm" className="font-sans"
                onClick={() => append({ dish_id: "", servings: 1 })}
              >
                <Plus size={14} className="mr-1" /> Agregar platillo
              </Button>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="font-sans">Cancelar</Button>
              <Button type="submit" disabled={loading} className="bg-[#2D2926] hover:bg-[#1A1714] text-white font-sans font-medium">
                {loading ? "Guardando…" : editing ? "Guardar cambios" : "Crear menú"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-heading">Eliminar menú</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground font-sans">
            ¿Eliminar <strong>{deleting?.name}</strong>? Los platillos asociados se desvincularán.
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

function MenuCard({ menu, onEdit, onDelete }: { menu: Menu; onEdit: () => void; onDelete: () => void }) {
  const lines = menu.menu_dishes.map((md) => {
    const dish = md.dishes
    const perServing = dish
      ? dish.recipe_items.reduce((acc, r) => acc + (r.ingredients?.current_price ?? 0) * r.quantity, 0) / (dish.servings_yield || 1)
      : 0
    return {
      name: dish?.name ?? "—",
      category: dish?.category ?? null,
      servings: md.servings,
      cost: perServing * md.servings,
    }
  })
  const total = lines.reduce((s, l) => s + l.cost, 0)

  return (
    <div className="enterprise-card p-4 flex flex-col gap-3 group">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "1.1rem", fontWeight: 600, color: "var(--text-1)", letterSpacing: "-0.01em", lineHeight: 1.2 }} className="truncate">
            {menu.name}
          </h3>
          <p className="mt-0.5 flex items-center gap-1.5 flex-wrap" style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", color: "var(--text-3)" }}>
            {menu.event_type && <span style={{ color: ACCENT, fontWeight: 600 }}>{menu.event_type}</span>}
            {menu.event_type && <span>·</span>}
            <span>{lines.length} platillo{lines.length !== 1 ? "s" : ""}</span>
          </p>
        </div>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit}><Pencil size={14} /></Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onDelete}><Trash2 size={14} /></Button>
        </div>
      </div>

      {lines.length > 0 ? (
        <div className="space-y-1">
          {lines.map((l, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: ACCENT, opacity: 0.5 }} />
              <span className="font-sans truncate flex-1" style={{ color: "var(--text-1)" }}>{l.name}</span>
              <span className="mono-data shrink-0" style={{ fontSize: "0.7rem", color: "var(--text-3)" }}>×{l.servings}</span>
              <span className="mono-data shrink-0 text-right" style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-1)", width: "4.5rem" }}>{formatCurrency(l.cost)}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs font-sans text-muted-foreground italic">Sin platillos — agrégalos para calcular el costo.</p>
      )}

      <div className="mt-auto pt-3 flex items-end justify-between" style={{ borderTop: "1px solid var(--border-def, #EBEBEC)" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)" }}>Costo estimado total</p>
        <p className="mono-data" style={{ fontSize: "1.25rem", fontWeight: 700, color: ACCENT, lineHeight: 1.1 }}>{formatCurrency(total)}</p>
      </div>
    </div>
  )
}
