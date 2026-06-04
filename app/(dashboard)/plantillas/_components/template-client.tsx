"use client"

import { useMemo, useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, LayoutTemplate, X, Search } from "lucide-react"
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
import { createTemplate, updateTemplate, deleteTemplate, type TemplateFormData } from "../actions"

const ACCENT = "#4C4F8A"

type TemplateItem = { id: string; description: string; quantity: number; unit_cost: number; sort_order: number }
export type Template = {
  id: string
  name: string
  event_type: string | null
  description: string | null
  price_per_guest: number
  is_active: boolean
  quote_template_items: TemplateItem[]
}

const itemSchema = z.object({
  description: z.string().min(1, "Describe el concepto"),
  quantity: z.number().min(0),
  unit_cost: z.number().min(0),
})
const schema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  event_type: z.string().optional(),
  description: z.string().optional(),
  price_per_guest: z.number().min(0),
  is_active: z.boolean(),
  items: z.array(itemSchema),
})
type FormValues = z.infer<typeof schema>

export function TemplateClient({ templates: initial }: { templates: Template[] }) {
  const [templates, setTemplates] = useState(initial)
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Template | null>(null)
  const [deleting, setDeleting] = useState<Template | null>(null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, reset, setValue, watch, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { price_per_guest: 0, is_active: true, items: [] },
  })
  const { fields, append, remove } = useFieldArray({ control, name: "items" })
  const watchEventType = watch("event_type")
  const watchItems = watch("items")
  const itemsTotal = (watchItems ?? []).reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.unit_cost) || 0), 0)

  function openCreate() {
    setEditing(null)
    reset({ name: "", event_type: "", description: "", price_per_guest: 0, is_active: true, items: [] })
    setOpen(true)
  }
  function openEdit(t: Template) {
    setEditing(t)
    reset({
      name: t.name, event_type: t.event_type ?? "", description: t.description ?? "",
      price_per_guest: t.price_per_guest, is_active: t.is_active,
      items: [...t.quote_template_items].sort((a, b) => a.sort_order - b.sort_order).map((i) => ({ description: i.description, quantity: i.quantity, unit_cost: i.unit_cost })),
    })
    setOpen(true)
  }

  async function onSubmit(data: FormValues) {
    setLoading(true)
    const payload: TemplateFormData = {
      name: data.name,
      event_type: data.event_type || undefined,
      description: data.description || undefined,
      price_per_guest: data.price_per_guest,
      is_active: data.is_active,
      items: data.items.map((i) => ({ description: i.description, quantity: i.quantity, unit_cost: i.unit_cost })),
    }
    const res = editing ? await updateTemplate(editing.id, payload) : await createTemplate(payload)
    if (res.error) { toast.error(res.error); setLoading(false); return }
    toast.success(editing ? "Plantilla actualizada" : "Plantilla creada")
    setOpen(false); setLoading(false)
    window.location.reload()
  }

  async function confirmDelete() {
    if (!deleting) return
    setLoading(true)
    const res = await deleteTemplate(deleting.id)
    if (res.error) { toast.error(res.error); setLoading(false); return }
    setTemplates((prev) => prev.filter((t) => t.id !== deleting.id))
    toast.success("Plantilla eliminada")
    setDeleting(null); setLoading(false)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return templates
    return templates.filter((t) => t.name.toLowerCase().includes(q) || (t.event_type ?? "").toLowerCase().includes(q))
  }, [templates, query])

  return (
    <>
      <div className="flex items-center gap-3 flex-wrap justify-between">
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar plantilla o tipo de evento…" className="pl-9 h-9 font-sans" />
        </div>
        <Button onClick={openCreate} className="bg-[#2D2926] hover:bg-[#1A1714] text-white font-sans font-medium">
          <Plus size={16} className="mr-1" /> Nueva plantilla
        </Button>
      </div>

      {templates.length === 0 ? (
        <EmptyState icon={LayoutTemplate} title="Sin plantillas"
          description="Crea paquetes reutilizables con su precio por persona para cotizar en segundos."
          action={{ label: "Crear plantilla", onClick: openCreate }} />
      ) : filtered.length === 0 ? (
        <div className="enterprise-card py-12 text-center">
          <p className="text-sm font-sans text-muted-foreground">Ninguna plantilla coincide con “{query}”.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 stagger-children">
          {filtered.map((t) => {
            const items = [...t.quote_template_items].sort((a, b) => a.sort_order - b.sort_order)
            const itemsCost = items.reduce((s, i) => s + i.quantity * i.unit_cost, 0)
            return (
              <div key={t.id} className="enterprise-card p-4 flex flex-col gap-3 group" style={{ borderLeft: `3px solid ${ACCENT}`, opacity: t.is_active ? 1 : 0.6 }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "1.1rem", fontWeight: 600, color: "var(--text-1)", lineHeight: 1.2 }} className="truncate">{t.name}</h3>
                    <p className="mt-0.5 flex items-center gap-1.5 flex-wrap" style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", color: "var(--text-3)" }}>
                      {t.event_type && <span style={{ color: ACCENT, fontWeight: 600 }}>{t.event_type}</span>}
                      {t.event_type && <span>·</span>}
                      <span>{items.length} concepto{items.length !== 1 ? "s" : ""}</span>
                      {!t.is_active && <><span>·</span><span>inactiva</span></>}
                    </p>
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(t)}><Pencil size={14} /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleting(t)}><Trash2 size={14} /></Button>
                  </div>
                </div>

                {t.description && <p className="text-xs font-sans text-muted-foreground line-clamp-2">{t.description}</p>}

                {items.length > 0 && (
                  <div className="space-y-1">
                    {items.slice(0, 5).map((i) => (
                      <div key={i.id} className="flex items-center gap-2 text-sm">
                        <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: ACCENT, opacity: 0.5 }} />
                        <span className="font-sans truncate flex-1" style={{ color: "var(--text-1)" }}>{i.description}</span>
                        <span className="mono-data shrink-0" style={{ fontSize: "0.7rem", color: "var(--text-3)" }}>×{i.quantity}</span>
                        <span className="mono-data shrink-0 text-right" style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-1)", width: "4.5rem" }}>{formatCurrency(i.quantity * i.unit_cost)}</span>
                      </div>
                    ))}
                    {items.length > 5 && <p className="text-xs font-sans text-muted-foreground">+{items.length - 5} más…</p>}
                  </div>
                )}

                <div className="mt-auto pt-3 flex items-end justify-between" style={{ borderTop: "1px solid var(--border-def, #EBEBEC)" }}>
                  <div>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)" }}>Costo conceptos</p>
                    <p className="mono-data" style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-2)" }}>{formatCurrency(itemsCost)}</p>
                  </div>
                  <div className="text-right">
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)" }}>Precio / persona</p>
                    <p className="mono-data" style={{ fontSize: "1.25rem", fontWeight: 700, color: ACCENT, lineHeight: 1.1 }}>{formatCurrency(t.price_per_guest)}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Crear / Editar */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading">{editing ? "Editar plantilla" : "Nueva plantilla"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="font-sans">Nombre *</Label>
                <Input {...register("name")} placeholder="Ej. Paquete Boda Plata" />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="font-sans">Tipo de evento</Label>
                <Select value={watchEventType} onValueChange={(v) => setValue("event_type", v ?? "")}>
                  <SelectTrigger className="font-sans"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((t) => <SelectItem key={t} value={t} className="font-sans">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="font-sans">Precio por persona (MXN)</Label>
                <Input {...register("price_per_guest", { valueAsNumber: true })} type="number" step="0.01" min="0" placeholder="0.00" />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="font-sans">Descripción</Label>
                <Textarea {...register("description")} placeholder="Qué incluye el paquete, condiciones, etc." rows={2} />
              </div>
              <div className="sm:col-span-2 flex items-center gap-3">
                <input type="checkbox" id="tpl_active" {...register("is_active")} className="h-4 w-4 rounded border-border accent-gold" />
                <Label htmlFor="tpl_active" className="font-sans cursor-pointer">Plantilla activa</Label>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-heading text-sm font-semibold">Conceptos incluidos</h4>
                  <p className="text-xs text-muted-foreground font-sans">Partidas que componen el paquete</p>
                </div>
                {fields.length > 0 && (
                  <p className="text-xs font-sans text-muted-foreground">Costo: <span className="font-semibold text-foreground mono-data">{formatCurrency(itemsTotal)}</span></p>
                )}
              </div>

              {fields.length > 0 && (
                <div className="rounded-md border border-border overflow-hidden">
                  <div className="grid grid-cols-[1fr_80px_100px_24px] gap-2 px-3 py-2 bg-muted/40 text-xs font-sans font-semibold uppercase tracking-wider text-muted-foreground">
                    <span>Concepto</span><span>Cant.</span><span>Costo unit.</span><span />
                  </div>
                  {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-[1fr_80px_100px_24px] gap-2 px-3 py-2 border-t border-border items-center">
                      <Input {...register(`items.${index}.description`)} placeholder="Concepto" className="h-8 text-sm font-sans" />
                      <Input {...register(`items.${index}.quantity`, { valueAsNumber: true })} type="number" step="0.01" min="0" placeholder="1" className="h-8 text-sm font-sans" />
                      <Input {...register(`items.${index}.unit_cost`, { valueAsNumber: true })} type="number" step="0.01" min="0" placeholder="0.00" className="h-8 text-sm font-sans" />
                      <button type="button" onClick={() => remove(index)} className="text-muted-foreground hover:text-destructive transition-colors"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}

              <Button type="button" variant="outline" size="sm" className="font-sans" onClick={() => append({ description: "", quantity: 1, unit_cost: 0 })}>
                <Plus size={14} className="mr-1" /> Agregar concepto
              </Button>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="font-sans">Cancelar</Button>
              <Button type="submit" disabled={loading} className="bg-[#2D2926] hover:bg-[#1A1714] text-white font-sans font-medium">
                {loading ? "Guardando…" : editing ? "Guardar cambios" : "Crear plantilla"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Eliminar */}
      <Dialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-heading">Eliminar plantilla</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground font-sans">¿Eliminar <strong>{deleting?.name}</strong>? Sus conceptos también se eliminarán.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} className="font-sans">Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={loading} className="font-sans">{loading ? "Eliminando…" : "Eliminar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
