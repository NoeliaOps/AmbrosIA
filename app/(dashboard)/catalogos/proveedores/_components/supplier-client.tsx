"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DataTable, type Column } from "@/components/tables/data-table"
import { EmptyState } from "@/components/ui/empty-state"
import { Badge } from "@/components/ui/badge"
import { createSupplier, updateSupplier, deleteSupplier, type SupplierFormData } from "../actions"

type Supplier = {
  id: string
  name: string
  contact_name: string | null
  phone: string | null
  email: string | null
  category: string | null
  notes: string | null
  is_active: boolean
}

const schema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  contact_name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Correo inválido").optional().or(z.literal("")),
  category: z.string().optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export function SupplierClient({ suppliers: initial }: { suppliers: Supplier[] }) {
  const [suppliers, setSuppliers] = useState(initial)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [deleting, setDeleting] = useState<Supplier | null>(null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  function openCreate() {
    setEditing(null)
    reset({})
    setOpen(true)
  }

  function openEdit(s: Supplier) {
    setEditing(s)
    reset({
      name: s.name,
      contact_name: s.contact_name ?? "",
      phone: s.phone ?? "",
      email: s.email ?? "",
      category: s.category ?? "",
      notes: s.notes ?? "",
    })
    setOpen(true)
  }

  async function onSubmit(data: FormValues) {
    setLoading(true)
    const payload: SupplierFormData = {
      name: data.name,
      contact_name: data.contact_name || undefined,
      phone: data.phone || undefined,
      email: data.email || undefined,
      category: data.category || undefined,
      notes: data.notes || undefined,
    }

    if (editing) {
      const { data: updated, error } = await updateSupplier(editing.id, payload)
      if (error) { toast.error(error); setLoading(false); return }
      setSuppliers((prev) => prev.map((s) => s.id === editing.id ? { ...s, ...(updated ?? {}) as Partial<Supplier> } : s))
      toast.success("Proveedor actualizado")
    } else {
      const { data: created, error } = await createSupplier(payload)
      if (error) { toast.error(error); setLoading(false); return }
      setSuppliers((prev) => [...prev, created as unknown as Supplier])
      toast.success("Proveedor creado")
    }
    setOpen(false)
    setLoading(false)
  }

  async function confirmDelete() {
    if (!deleting) return
    setLoading(true)
    const { error } = await deleteSupplier(deleting.id)
    if (error) { toast.error(error); setLoading(false); return }
    setSuppliers((prev) => prev.filter((s) => s.id !== deleting.id))
    toast.success("Proveedor eliminado")
    setDeleting(null)
    setLoading(false)
  }

  const columns: Column<Supplier>[] = [
    { key: "name", header: "Nombre", sortable: true,
      cell: (row) => <span className="font-medium">{row.name}</span> },
    { key: "category", header: "Categoría",
      cell: (row) => row.category ? <Badge variant="secondary" className="font-sans text-xs">{row.category}</Badge> : "—" },
    { key: "contact_name", header: "Contacto",
      cell: (row) => row.contact_name ?? "—" },
    { key: "phone", header: "Teléfono",
      cell: (row) => row.phone ?? "—" },
    { key: "email", header: "Correo",
      cell: (row) => row.email ?? "—" },
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
        data={suppliers}
        columns={columns}
        searchPlaceholder="Buscar proveedor..."
        searchKeys={["name", "category", "contact_name"] as (keyof Supplier)[]}
        actions={
          <Button onClick={openCreate} className="bg-gold hover:bg-gold-dark text-ink font-sans font-medium">
            <Plus size={16} className="mr-1" /> Nuevo proveedor
          </Button>
        }
        emptyState={
          <EmptyState
            icon={Truck}
            title="Sin proveedores"
            description="Agrega tus proveedores para comenzar."
            action={{ label: "Agregar proveedor", onClick: openCreate }}
          />
        }
      />

      {/* Create / Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">{editing ? "Editar proveedor" : "Nuevo proveedor"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="font-sans">Nombre *</Label>
                <Input {...register("name")} placeholder="Ej. Cárnicos del Valle" />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="font-sans">Categoría</Label>
                <Input {...register("category")} placeholder="Ej. Carnes, Verduras…" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-sans">Contacto</Label>
                <Input {...register("contact_name")} placeholder="Nombre del contacto" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-sans">Teléfono</Label>
                <Input {...register("phone")} placeholder="442-123-4567" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-sans">Correo</Label>
                <Input {...register("email")} type="email" placeholder="contacto@proveedor.mx" />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="font-sans">Notas</Label>
                <Textarea {...register("notes")} placeholder="Días de entrega, condiciones de pago, etc." rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="font-sans">Cancelar</Button>
              <Button type="submit" disabled={loading} className="bg-gold hover:bg-gold-dark text-ink font-sans font-medium">
                {loading ? "Guardando…" : editing ? "Guardar cambios" : "Crear proveedor"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Eliminar proveedor</DialogTitle>
          </DialogHeader>
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
