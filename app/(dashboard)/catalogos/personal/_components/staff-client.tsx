"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Users } from "lucide-react"
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
import { STAFF_POSITIONS } from "@/lib/constants"
import { createStaff, updateStaff, deleteStaff, type StaffFormData } from "../actions"

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

const RATE_TYPE_LABEL: Record<string, string> = {
  hourly: "Por hora",
  daily: "Por día",
  event: "Por evento",
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

  const columns: Column<StaffMember>[] = [
    { key: "name", header: "Nombre", sortable: true,
      cell: (row) => <span className="font-medium">{row.name}</span> },
    { key: "position", header: "Puesto",
      cell: (row) => <Badge variant="secondary" className="font-sans text-xs">{row.position}</Badge> },
    { key: "rate", header: "Tarifa", sortable: true,
      cell: (row) => (
        <span className="tabular-nums font-medium">
          {formatCurrency(row.rate)}
          <span className="text-muted-foreground font-normal ml-1 text-xs">/{RATE_TYPE_LABEL[row.rate_type] ?? row.rate_type}</span>
        </span>
      )},
    { key: "phone", header: "Teléfono",
      cell: (row) => <span className="text-muted-foreground">{row.phone ?? "—"}</span> },
    { key: "is_active", header: "Estado",
      cell: (row) => (
        <span className={`status-pill ${row.is_active ? "pill-active" : "pill-draft"}`}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: "currentColor" }} />
          {row.is_active ? "Activo" : "Inactivo"}
        </span>
      )},
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

  return (
    <>
      <DataTable
        data={staff}
        columns={columns}
        searchPlaceholder="Buscar colaborador..."
        searchKeys={["name", "position"] as (keyof StaffMember)[]}
        actions={
          <Button onClick={openCreate} className="bg-[#2D2926] hover:bg-[#1A1714] text-white font-sans font-medium">
            <Plus size={16} className="mr-1" /> Nuevo colaborador
          </Button>
        }
        emptyState={
          <EmptyState icon={Users} title="Sin personal"
            description="Agrega los colaboradores que participan en tus eventos."
            action={{ label: "Agregar colaborador", onClick: openCreate }} />
        }
      />

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
