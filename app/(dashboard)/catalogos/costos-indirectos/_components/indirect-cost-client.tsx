"use client"

import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Calculator, Search, Hash, Users as UsersIcon, Percent } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { formatCurrency } from "@/lib/utils"
import { INDIRECT_COST_ALLOCATION } from "@/lib/constants"
import { createIndirectCost, updateIndirectCost, deleteIndirectCost, type IndirectCostFormData } from "../actions"

// Identidad del módulo (Catálogo → cacao)
const ACCENT = "#6B4A2F"

type AllocationMethod = "fixed" | "per_guest" | "percentage"

type IndirectCost = {
  id: string
  name: string
  default_amount: number
  allocation_method: AllocationMethod
  description: string | null
  is_active: boolean
}

const schema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  default_amount: z.number().min(0, "El monto debe ser positivo"),
  allocation_method: z.enum(["fixed", "per_guest", "percentage"]),
  description: z.string().optional(),
  is_active: z.boolean(),
})

type FormValues = z.infer<typeof schema>

type Props = { costs: IndirectCost[] }

const ALLOCATION_LABELS: Record<AllocationMethod, string> = {
  fixed: "Monto fijo",
  per_guest: "Por persona",
  percentage: "Porcentaje",
}
const ALLOCATION_ICON = { fixed: Hash, per_guest: UsersIcon, percentage: Percent } as const

export function IndirectCostClient({ costs: initial }: Props) {
  const [costs, setCosts] = useState(initial)
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<IndirectCost | null>(null)
  const [deleting, setDeleting] = useState<IndirectCost | null>(null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { default_amount: 0, allocation_method: "fixed", is_active: true },
  })

  const watchMethod = watch("allocation_method")

  function openCreate() {
    setEditing(null)
    reset({ default_amount: 0, allocation_method: "fixed", is_active: true })
    setOpen(true)
  }

  function openEdit(item: IndirectCost) {
    setEditing(item)
    reset({
      name: item.name,
      default_amount: item.default_amount,
      allocation_method: item.allocation_method,
      description: item.description ?? "",
      is_active: item.is_active,
    })
    setOpen(true)
  }

  async function onSubmit(data: FormValues) {
    setLoading(true)
    const payload: IndirectCostFormData = {
      name: data.name,
      default_amount: data.default_amount,
      allocation_method: data.allocation_method,
      description: data.description || undefined,
      is_active: data.is_active,
    }

    if (editing) {
      const { data: updated, error } = await updateIndirectCost(editing.id, payload)
      if (error) { toast.error(error); setLoading(false); return }
      setCosts((prev) => prev.map((c) => c.id === editing.id ? { ...c, ...(updated ?? {}) as Partial<IndirectCost> } : c))
      toast.success("Costo actualizado")
    } else {
      const { data: created, error } = await createIndirectCost(payload)
      if (error) { toast.error(error); setLoading(false); return }
      setCosts((prev) => [...prev, created as unknown as IndirectCost])
      toast.success("Costo creado")
    }
    setOpen(false)
    setLoading(false)
  }

  async function confirmDelete() {
    if (!deleting) return
    setLoading(true)
    const { error } = await deleteIndirectCost(deleting.id)
    if (error) { toast.error(error); setLoading(false); return }
    setCosts((prev) => prev.filter((c) => c.id !== deleting.id))
    toast.success("Costo eliminado")
    setDeleting(null)
    setLoading(false)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return costs
    return costs.filter((c) => c.name.toLowerCase().includes(q))
  }, [costs, query])

  return (
    <>
      <div className="flex items-center gap-3 flex-wrap justify-between">
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar concepto…" className="pl-9 h-9 font-sans" />
        </div>
        <Button onClick={openCreate} className="bg-[#2D2926] hover:bg-[#1A1714] text-white font-sans font-medium">
          <Plus size={16} className="mr-1" /> Nuevo costo
        </Button>
      </div>

      {costs.length === 0 ? (
        <EmptyState icon={Calculator} title="Sin costos indirectos"
          description="Define los costos fijos y variables que aplican a tus eventos."
          action={{ label: "Agregar costo", onClick: openCreate }} />
      ) : filtered.length === 0 ? (
        <div className="enterprise-card py-12 text-center">
          <p className="text-sm font-sans text-muted-foreground">Ningún concepto coincide con “{query}”.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 stagger-children">
          {filtered.map((c) => {
            const Icon = ALLOCATION_ICON[c.allocation_method]
            return (
              <div key={c.id} className="enterprise-card p-4 flex flex-col gap-3 group" style={{ opacity: c.is_active ? 1 : 0.6 }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "1rem", fontWeight: 600, color: "var(--text-1)", lineHeight: 1.2 }} className="truncate">{c.name}</p>
                    <span className="inline-flex items-center gap-1 mt-1" style={{ fontFamily: "var(--font-sans)", fontSize: "0.68rem", fontWeight: 600, color: ACCENT, background: `color-mix(in srgb, ${ACCENT} 10%, white)`, padding: "0.1rem 0.45rem", borderRadius: "9999px" }}>
                      <Icon size={11} /> {ALLOCATION_LABELS[c.allocation_method]}
                    </span>
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(c)}><Pencil size={14} /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleting(c)}><Trash2 size={14} /></Button>
                  </div>
                </div>
                {c.description && <p className="text-xs font-sans text-muted-foreground line-clamp-2">{c.description}</p>}
                <div className="mt-auto pt-2" style={{ borderTop: "1px solid var(--border-def, #EBEBEC)" }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)" }}>Valor por defecto</p>
                  <p className="mono-data" style={{ fontSize: "1.3rem", fontWeight: 700, color: ACCENT, lineHeight: 1.1 }}>
                    {c.allocation_method === "percentage" ? `${c.default_amount}%` : formatCurrency(c.default_amount)}
                    {c.allocation_method === "per_guest" && <span style={{ fontSize: "0.7rem", color: "var(--text-3)", fontWeight: 400 }}> / persona</span>}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create / Edit */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">{editing ? "Editar costo" : "Nuevo costo indirecto"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="font-sans">Nombre del concepto *</Label>
                <Input {...register("name")} placeholder="Ej. Renta de vajilla" />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="font-sans">Método de asignación *</Label>
                <Select value={watchMethod} onValueChange={(v) => setValue("allocation_method", (v ?? "fixed") as AllocationMethod)}>
                  <SelectTrigger className="font-sans"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                  <SelectContent>
                    {INDIRECT_COST_ALLOCATION.map((m) => (
                      <SelectItem key={m.value} value={m.value} className="font-sans">{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.allocation_method && <p className="text-xs text-destructive">{errors.allocation_method.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="font-sans">
                  {watchMethod === "percentage" ? "Porcentaje (%)" : "Monto por defecto (MXN)"} *
                </Label>
                <Input {...register("default_amount", { valueAsNumber: true })} type="number" step="0.01" min="0" placeholder="0.00" />
                {errors.default_amount && <p className="text-xs text-destructive">{errors.default_amount.message}</p>}
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label className="font-sans">Descripción</Label>
                <Textarea {...register("description")} placeholder="Descripción adicional..." rows={2} />
              </div>

              <div className="sm:col-span-2 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="cost_is_active"
                  {...register("is_active")}
                  className="h-4 w-4 rounded border-border accent-gold"
                />
                <Label htmlFor="cost_is_active" className="font-sans cursor-pointer">Costo activo</Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="font-sans">Cancelar</Button>
              <Button type="submit" disabled={loading} className="bg-[#2D2926] hover:bg-[#1A1714] text-white font-sans font-medium">
                {loading ? "Guardando…" : editing ? "Guardar cambios" : "Crear costo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-heading">Eliminar costo</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground font-sans">
            ¿Eliminar <strong>{deleting?.name}</strong>? Esta acción no se puede deshacer.
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
