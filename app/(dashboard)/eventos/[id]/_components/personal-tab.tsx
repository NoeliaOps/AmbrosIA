"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, UserCheck, AlertTriangle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"
import { createAssignment, updateAssignment, deleteAssignment, checkConflicts } from "../staff-assignment-actions"

const RATE_TYPE_LABEL: Record<string, string> = {
  hourly: "/hr",
  daily: "/día",
  event: "/evento",
}

type StaffMember = {
  id: string
  name: string
  position: string
  rate: number
  rate_type: string
  phone: string | null
}

type Assignment = {
  id: string
  staff_member_id: string
  role: string | null
  call_time: string | null
  estimated_hours: number
  computed_cost: number
  notes: string | null
  staff_members: StaffMember | null
}

type Props = {
  eventId: string
  eventDate: string
  initialAssignments: Assignment[]
  staffMembers: StaffMember[]
}

const schema = z.object({
  staff_member_id: z.string().min(1, "Selecciona un colaborador"),
  role: z.string().optional(),
  call_time: z.string().optional(),
  estimated_hours: z.number().min(0.5, "Mínimo 0.5 hrs").max(24, "Máximo 24 hrs"),
  notes: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export function PersonalTab({ eventId, eventDate, initialAssignments, staffMembers }: Props) {
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Assignment | null>(null)
  const [deleting, setDeleting] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(false)
  const [conflicts, setConflicts] = useState<{ id: string; name: string; event_date: string }[]>([])

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { estimated_hours: 8 },
  })

  const watchStaffId = watch("staff_member_id")
  const watchHours = watch("estimated_hours")

  const selectedMember = staffMembers.find((s) => s.id === watchStaffId)

  const assignedIds = new Set(assignments.map((a) => a.staff_member_id))
  const availableStaff = staffMembers.filter((s) => !assignedIds.has(s.id) || (editing && editing.staff_member_id === s.id))

  function computePreview(member: StaffMember | undefined, hours: number) {
    if (!member) return 0
    if (member.rate_type === "hourly") return member.rate * hours
    return member.rate
  }

  async function handleStaffSelect(id: string) {
    setValue("staff_member_id", id)
    if (!id) return
    const found = await checkConflicts(id, eventId, eventDate)
    setConflicts(found)
  }

  function openCreate() {
    setEditing(null)
    setConflicts([])
    reset({ estimated_hours: 8 })
    setOpen(true)
  }

  function openEdit(a: Assignment) {
    setEditing(a)
    setConflicts([])
    reset({
      staff_member_id: a.staff_member_id,
      role: a.role ?? "",
      call_time: a.call_time ?? "",
      estimated_hours: a.estimated_hours,
      notes: a.notes ?? "",
    })
    setOpen(true)
  }

  async function onSubmit(data: FormValues) {
    setLoading(true)
    const payload = {
      staff_member_id: data.staff_member_id,
      role: data.role || undefined,
      call_time: data.call_time || undefined,
      estimated_hours: data.estimated_hours,
      notes: data.notes || undefined,
    }

    if (editing) {
      const { data: updated, error } = await updateAssignment(editing.id, eventId, payload)
      if (error) { toast.error(error); setLoading(false); return }
      setAssignments((prev) => prev.map((a) => a.id === editing.id ? updated as unknown as Assignment : a))
      toast.success("Asignación actualizada")
    } else {
      const { data: created, error } = await createAssignment(eventId, payload)
      if (error) { toast.error(error); setLoading(false); return }
      setAssignments((prev) => [...prev, created as unknown as Assignment])
      toast.success("Colaborador asignado")
    }
    setOpen(false)
    setLoading(false)
  }

  async function confirmDelete() {
    if (!deleting) return
    setLoading(true)
    const { error } = await deleteAssignment(deleting.id, eventId)
    if (error) { toast.error(error); setLoading(false); return }
    setAssignments((prev) => prev.filter((a) => a.id !== deleting.id))
    toast.success("Asignación eliminada")
    setDeleting(null)
    setLoading(false)
  }

  const totalStaffCost = assignments.reduce((s, a) => s + a.computed_cost, 0)
  const previewCost = computePreview(selectedMember, watchHours ?? 8)

  return (
    <div className="space-y-5">
      {/* Summary KPI */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="inline-flex items-center gap-3 rounded-lg border border-border px-4 py-3">
          <div>
            <p className="text-xs font-sans text-muted-foreground uppercase tracking-wider">Personal asignado</p>
            <p className="text-2xl font-heading font-bold">{assignments.length}</p>
          </div>
          <div className="h-10 w-px bg-border" />
          <div>
            <p className="text-xs font-sans text-muted-foreground uppercase tracking-wider">Costo total</p>
            <p className="text-2xl font-heading font-bold tabular-nums">{formatCurrency(totalStaffCost)}</p>
          </div>
        </div>
        <Button onClick={openCreate} className="bg-gold hover:bg-gold-dark text-ink font-sans font-medium">
          <Plus size={16} className="mr-1" /> Asignar colaborador
        </Button>
      </div>

      {assignments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center space-y-3">
          <UserCheck size={32} className="mx-auto text-muted-foreground" />
          <p className="font-heading font-semibold">Sin personal asignado</p>
          <p className="text-sm font-sans text-muted-foreground">
            Asigna colaboradores para este evento para calcular el costo de personal.
          </p>
        </div>
      ) : (
        <div className="rounded-md border border-border overflow-hidden">
          <div className="grid grid-cols-[1fr_140px_80px_80px_100px_80px] gap-2 px-3 py-2 bg-muted/40 text-xs font-sans font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Colaborador</span>
            <span>Rol</span>
            <span className="text-center">Entrada</span>
            <span className="text-right">Hrs.</span>
            <span className="text-right">Costo</span>
            <span></span>
          </div>
          {assignments.map((a) => {
            const member = a.staff_members
            return (
              <div key={a.id} className="grid grid-cols-[1fr_140px_80px_80px_100px_80px] gap-2 px-3 py-2.5 border-t border-border items-center text-sm font-sans">
                <div className="min-w-0">
                  <p className="font-medium truncate">{member?.name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{member?.position ?? ""}</p>
                </div>
                <span className="text-muted-foreground truncate">{a.role ?? "—"}</span>
                <span className="text-center text-muted-foreground flex items-center justify-center gap-1">
                  {a.call_time ? (
                    <><Clock size={11} />{a.call_time.slice(0, 5)}</>
                  ) : "—"}
                </span>
                <span className="tabular-nums text-right text-muted-foreground">
                  {member?.rate_type === "hourly" ? `${a.estimated_hours}h` : "—"}
                </span>
                <span className="tabular-nums text-right font-medium">{formatCurrency(a.computed_cost)}</span>
                <div className="flex justify-end gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(a)}>
                    <Pencil size={13} />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleting(a)}>
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
            )
          })}
          <div className="grid grid-cols-[1fr_140px_80px_80px_100px_80px] gap-2 px-3 py-2.5 border-t-2 border-border bg-muted/30">
            <span className="font-semibold text-sm font-sans col-span-4">Total personal</span>
            <span className="tabular-nums text-right font-semibold text-sm font-sans">{formatCurrency(totalStaffCost)}</span>
            <span></span>
          </div>
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">{editing ? "Editar asignación" : "Asignar colaborador"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="font-sans">Colaborador *</Label>
              <Select
                value={watchStaffId}
                onValueChange={(v) => handleStaffSelect(v ?? "")}
                disabled={!!editing}
              >
                <SelectTrigger className="font-sans">
                  <SelectValue placeholder="Selecciona un colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {availableStaff.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="font-sans">
                      <span>{s.name}</span>
                      <span className="ml-2 text-muted-foreground text-xs">· {s.position}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.staff_member_id && <p className="text-xs text-destructive">{errors.staff_member_id.message}</p>}
            </div>

            {conflicts.length > 0 && (
              <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm font-sans text-amber-800">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <p>
                  Conflicto: este colaborador también está asignado a{" "}
                  {conflicts.map((c) => <strong key={c.id}>{c.name}</strong>)} en la misma fecha.
                </p>
              </div>
            )}

            {selectedMember && (
              <div className="rounded-md bg-muted/40 px-3 py-2 text-sm font-sans">
                <span className="text-muted-foreground">Tarifa: </span>
                <span className="font-medium tabular-nums">{formatCurrency(selectedMember.rate)}</span>
                <span className="text-muted-foreground">{RATE_TYPE_LABEL[selectedMember.rate_type] ?? ""}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-sans">Rol en el evento</Label>
                <Input {...register("role")} placeholder="Ej. Chef de cocina" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-sans">Hora de entrada</Label>
                <Input {...register("call_time")} type="time" />
              </div>
            </div>

            {selectedMember?.rate_type === "hourly" && (
              <div className="space-y-1.5">
                <Label className="font-sans">Horas estimadas *</Label>
                <Input {...register("estimated_hours", { valueAsNumber: true })} type="number" step="0.5" min="0.5" max="24" placeholder="8" />
                {errors.estimated_hours && <p className="text-xs text-destructive">{errors.estimated_hours.message}</p>}
              </div>
            )}

            {selectedMember && (
              <div className="rounded-md border border-border px-3 py-2.5 flex justify-between items-center">
                <span className="text-sm font-sans text-muted-foreground">Costo estimado</span>
                <span className="font-heading font-bold tabular-nums">{formatCurrency(previewCost)}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="font-sans">Notas</Label>
              <Input {...register("notes")} placeholder="Indicaciones especiales, uniforme, etc." />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="font-sans">Cancelar</Button>
              <Button type="submit" disabled={loading} className="bg-gold hover:bg-gold-dark text-ink font-sans font-medium">
                {loading ? "Guardando…" : editing ? "Guardar cambios" : "Asignar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-heading">Eliminar asignación</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground font-sans">
            ¿Quitar a <strong>{deleting?.staff_members?.name}</strong> de este evento?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} className="font-sans">Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={loading} className="font-sans">
              {loading ? "Eliminando…" : "Quitar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
