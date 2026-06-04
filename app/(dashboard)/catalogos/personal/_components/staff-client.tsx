"use client"

import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Users, Search, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { formatCurrency } from "@/lib/utils"
import { STAFF_POSITIONS } from "@/lib/constants"
import { createStaff, updateStaff, deleteStaff, type StaffFormData } from "../actions"

// Identidad del módulo (Catálogo → acero)
const ACCENT = "#4A5568"
const RATE_SHORT: Record<string, string> = { hourly: "/hr", daily: "/día", event: "/evento" }
function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
}

type StaffMember = {
  id: string
  name: string
  position: string
  rate: number
  rate_type: "hourly" | "daily" | "event"
  phone: string | null
  notes: string | null
  is_active: boolean
}

const schema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  position: z.string().min(1, "El puesto es requerido"),
  rate: z.number().min(0, "La tarifa debe ser positiva"),
  rate_type: z.enum(["hourly", "daily", "event"]),
  phone: z.string().optional(),
  notes: z.string().optional(),
  is_active: z.boolean(),
})

type FormValues = z.infer<typeof schema>

type Props = { staff: StaffMember[] }

export function StaffClient({ staff: initial }: Props) {
  const [staff, setStaff] = useState(initial)
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<StaffMember | null>(null)
  const [deleting, setDeleting] = useState<StaffMember | null>(null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { rate: 0, rate_type: "daily", is_active: true },
  })

  const watchPosition = watch("position")
  const watchRateType = watch("rate_type")

  function openCreate() {
    setEditing(null)
    reset({ rate: 0, rate_type: "daily", is_active: true })
    setOpen(true)
  }

  function openEdit(item: StaffMember) {
    setEditing(item)
    reset({
      name: item.name,
      position: item.position,
      rate: item.rate,
      rate_type: item.rate_type,
      phone: item.phone ?? "",
      notes: item.notes ?? "",
      is_active: item.is_active,
    })
    setOpen(true)
  }

  async function onSubmit(data: FormValues) {
    setLoading(true)
    const payload: StaffFormData = {
      name: data.name,
      position: data.position,
      rate: data.rate,
      rate_type: data.rate_type,
      phone: data.phone || undefined,
      notes: data.notes || undefined,
      is_active: data.is_active,
    }

    if (editing) {
      const { data: updated, error } = await updateStaff(editing.id, payload)
      if (error) { toast.error(error); setLoading(false); return }
      setStaff((prev) => prev.map((s) => s.id === editing.id ? { ...s, ...(updated ?? {}) as Partial<StaffMember> } : s))
      toast.success("Colaborador actualizado")
    } else {
      const { data: created, error } = await createStaff(payload)
      if (error) { toast.error(error); setLoading(false); return }
      setStaff((prev) => [...prev, created as unknown as StaffMember])
      toast.success("Colaborador creado")
    }
    setOpen(false)
    setLoading(false)
  }

  async function confirmDelete() {
    if (!deleting) return
    setLoading(true)
    const { error } = await deleteStaff(deleting.id)
    if (error) { toast.error(error); setLoading(false); return }
    setStaff((prev) => prev.filter((s) => s.id !== deleting.id))
    toast.success("Colaborador eliminado")
    setDeleting(null)
    setLoading(false)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return staff
    return staff.filter((s) => s.name.toLowerCase().includes(q) || s.position.toLowerCase().includes(q))
  }, [staff, query])

  return (
    <>
      <div className="flex items-center gap-3 flex-wrap justify-between">
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar colaborador o puesto…" className="pl-9 h-9 font-sans" />
        </div>
        <Button onClick={openCreate} className="bg-[#2D2926] hover:bg-[#1A1714] text-white font-sans font-medium">
          <Plus size={16} className="mr-1" /> Nuevo colaborador
        </Button>
      </div>

      {staff.length === 0 ? (
        <EmptyState icon={Users} title="Sin personal"
          description="Agrega los colaboradores que participan en tus eventos."
          action={{ label: "Agregar colaborador", onClick: openCreate }} />
      ) : filtered.length === 0 ? (
        <div className="enterprise-card py-12 text-center">
          <p className="text-sm font-sans text-muted-foreground">Ningún colaborador coincide con “{query}”.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 stagger-children">
          {filtered.map((s) => (
            <div key={s.id} className="enterprise-card p-4 flex items-center gap-3 group" style={{ opacity: s.is_active ? 1 : 0.6 }}>
              <div className="shrink-0 grid place-items-center rounded-full mono-data" style={{ height: "2.75rem", width: "2.75rem", background: `color-mix(in srgb, ${ACCENT} 12%, white)`, color: ACCENT, fontSize: "0.85rem", fontWeight: 700 }}>
                {initials(s.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "0.98rem", fontWeight: 600, color: "var(--text-1)", lineHeight: 1.2 }} className="truncate">{s.name}</p>
                  {!s.is_active && <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)" }}>inactivo</span>}
                </div>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", fontWeight: 600, color: ACCENT }} className="truncate">{s.position}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="mono-data" style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-1)" }}>
                    {formatCurrency(s.rate)}<span style={{ color: "var(--text-3)", fontWeight: 400 }}>{RATE_SHORT[s.rate_type] ?? ""}</span>
                  </span>
                  {s.phone && (
                    <a href={`tel:${s.phone.replace(/\s/g, "")}`} className="flex items-center gap-1 text-xs font-sans hover:text-gold-dark transition-colors" style={{ color: "var(--text-3)" }} onClick={(e) => e.stopPropagation()}>
                      <Phone size={11} /> {s.phone}
                    </a>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(s)}><Pencil size={14} /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleting(s)}><Trash2 size={14} /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">{editing ? "Editar colaborador" : "Nuevo colaborador"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="font-sans">Nombre completo *</Label>
                <Input {...register("name")} placeholder="Ej. María González" />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="font-sans">Puesto *</Label>
                <Select value={watchPosition} onValueChange={(v) => setValue("position", v ?? "")}>
                  <SelectTrigger className="font-sans"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                  <SelectContent>
                    {STAFF_POSITIONS.map((p) => (
                      <SelectItem key={p} value={p} className="font-sans">{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.position && <p className="text-xs text-destructive">{errors.position.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="font-sans">Tipo de tarifa *</Label>
                <Select value={watchRateType} onValueChange={(v) => setValue("rate_type", (v ?? "daily") as FormValues["rate_type"])}>
                  <SelectTrigger className="font-sans"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly" className="font-sans">Por hora</SelectItem>
                    <SelectItem value="daily" className="font-sans">Por día</SelectItem>
                    <SelectItem value="event" className="font-sans">Por evento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="font-sans">
                  Tarifa ({watchRateType === "hourly" ? "MXN/hora" : watchRateType === "event" ? "MXN/evento" : "MXN/día"}) *
                </Label>
                <Input {...register("rate", { valueAsNumber: true })} type="number" step="0.01" min="0" placeholder="0.00" />
                {errors.rate && <p className="text-xs text-destructive">{errors.rate.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="font-sans">Teléfono</Label>
                <Input {...register("phone")} placeholder="+52 442 123 4567" />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label className="font-sans">Notas</Label>
                <Textarea {...register("notes")} placeholder="Especialidades, disponibilidad, etc." rows={2} />
              </div>

              <div className="sm:col-span-2 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  {...register("is_active")}
                  className="h-4 w-4 rounded border-border accent-gold"
                />
                <Label htmlFor="is_active" className="font-sans cursor-pointer">Colaborador activo</Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="font-sans">Cancelar</Button>
              <Button type="submit" disabled={loading} className="bg-[#2D2926] hover:bg-[#1A1714] text-white font-sans font-medium">
                {loading ? "Guardando…" : editing ? "Guardar cambios" : "Crear colaborador"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-heading">Eliminar colaborador</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground font-sans">
            ¿Eliminar a <strong>{deleting?.name}</strong>? Esta acción no se puede deshacer.
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
