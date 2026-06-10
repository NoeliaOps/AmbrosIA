"use client"

import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Truck, Search, Phone, Mail, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EmptyState } from "@/components/ui/empty-state"
import { SUPPLIER_CATEGORIES } from "@/lib/constants"
import { createSupplier, updateSupplier, deleteSupplier, type SupplierFormData } from "../actions"

// Identidad del módulo (Catálogo → azul pizarra)
const ACCENT = "#3D5A80"

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
}

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
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [deleting, setDeleting] = useState<Supplier | null>(null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })
  const watchCategory = watch("category")

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return suppliers
    return suppliers.filter((s) =>
      s.name.toLowerCase().includes(q) ||
      (s.category ?? "").toLowerCase().includes(q) ||
      (s.contact_name ?? "").toLowerCase().includes(q)
    )
  }, [suppliers, query])

  return (
    <>
      <div className="flex items-center gap-3 flex-wrap justify-between">
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar proveedor o categoría…" className="pl-9 h-9 font-sans" />
        </div>
        <Button onClick={openCreate} className="bg-[#2D2926] hover:bg-[#1A1714] text-white font-sans font-medium">
          <Plus size={16} className="mr-1" /> Nuevo proveedor
        </Button>
      </div>

      {suppliers.length === 0 ? (
        <EmptyState icon={Truck} title="Sin proveedores"
          description="Agrega tus proveedores para comenzar."
          action={{ label: "Agregar proveedor", onClick: openCreate }} />
      ) : filtered.length === 0 ? (
        <div className="enterprise-card py-12 text-center">
          <p className="text-sm font-sans text-muted-foreground">Ningún proveedor coincide con “{query}”.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 stagger-children">
          {filtered.map((s) => (
            <div key={s.id} className="enterprise-card p-4 flex flex-col gap-3 group">
              <div className="flex items-start gap-3">
                <div className="shrink-0 grid place-items-center rounded-xl mono-data" style={{ height: "2.5rem", width: "2.5rem", background: `color-mix(in srgb, ${ACCENT} 11%, white)`, color: ACCENT, fontSize: "0.8rem", fontWeight: 700 }}>
                  {initials(s.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "1rem", fontWeight: 600, color: "var(--text-1)", lineHeight: 1.2 }} className="truncate">{s.name}</p>
                  {s.category && <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", fontWeight: 600, color: ACCENT }} className="truncate">{s.category}</p>}
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(s)}><Pencil size={14} /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleting(s)}><Trash2 size={14} /></Button>
                </div>
              </div>

              <div className="space-y-1.5 text-sm" style={{ borderTop: "1px solid var(--border-def, #EBEBEC)", paddingTop: "0.75rem" }}>
                {s.contact_name && (
                  <p className="flex items-center gap-2 font-sans" style={{ color: "var(--text-2)" }}>
                    <User size={13} className="text-muted-foreground shrink-0" /> {s.contact_name}
                  </p>
                )}
                {s.phone ? (
                  <a href={`tel:${s.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 font-sans hover:text-gold-dark transition-colors" style={{ color: "var(--text-2)" }}>
                    <Phone size={13} className="text-muted-foreground shrink-0" /> {s.phone}
                  </a>
                ) : null}
                {s.email ? (
                  <a href={`mailto:${s.email}`} className="flex items-center gap-2 font-sans hover:text-gold-dark transition-colors truncate" style={{ color: "var(--text-2)" }}>
                    <Mail size={13} className="text-muted-foreground shrink-0" /> <span className="truncate">{s.email}</span>
                  </a>
                ) : null}
                {!s.contact_name && !s.phone && !s.email && (
                  <p className="font-sans text-xs italic text-muted-foreground">Sin datos de contacto.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

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
                <Select value={watchCategory ?? ""} onValueChange={(v) => setValue("category", v ?? "")}>
                  <SelectTrigger className="font-sans"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                  <SelectContent>
                    {SUPPLIER_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c} className="font-sans">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <Button type="submit" disabled={loading} className="bg-[#2D2926] hover:bg-[#1A1714] text-white font-sans font-medium">
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
