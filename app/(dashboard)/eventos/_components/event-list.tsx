"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Plus, CalendarDays, Search, ChevronRight, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { formatDate, formatShortDate, googleCalendarEventUrl } from "@/lib/utils"
import { EVENT_TYPES } from "@/lib/constants"
import { createEvent, createClient2, type EventFormData } from "../actions"

type Client = { id: string; name: string; phone: string | null; email: string | null }

type Event = {
  id: string
  name: string
  event_type: string | null
  event_date: string
  location: string | null
  guest_count: number
  status: string
  clients: { name: string } | null
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  cotizado:       { label: "Cotizado",       dot: "bg-blue-400",    text: "text-blue-400",    bg: "" },
  contratado:     { label: "Contratado",     dot: "bg-emerald-400", text: "text-emerald-400", bg: "" },
  en_requisicion: { label: "En requisición", dot: "bg-amber-400",   text: "text-amber-400",   bg: "" },
  en_compras:     { label: "En compras",     dot: "bg-orange-400",  text: "text-orange-400",  bg: "" },
  completado:     { label: "Completado",     dot: "bg-sage",        text: "text-sage",         bg: "" },
  cancelado:      { label: "Cancelado",      dot: "bg-red-400",     text: "text-red-400",      bg: "" },
}

const schema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  client_id: z.string().optional(),
  new_client_name: z.string().optional(),
  event_type: z.string().optional(),
  event_date: z.string().min(1, "La fecha es requerida"),
  event_time: z.string().optional(),
  location: z.string().optional(),
  guest_count: z.number().int().positive("Debe ser mayor a 0"),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

import Link from "next/link"

type Props = {
  events: Event[]
  clients: Client[]
  page?: number
  totalPages?: number
  totalCount?: number
}

export function EventList({ events: initial, clients: initialClients, page = 1, totalPages = 1, totalCount }: Props) {
  const router = useRouter()
  const [events] = useState(initial)
  const [clients, setClients] = useState(initialClients)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [clientMode, setClientMode] = useState<"existing" | "new">("existing")

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { guest_count: 1 },
  })

  const watchClientId = watch("client_id")
  const watchEventType = watch("event_type")

  function openCreate() {
    reset({ guest_count: 1 })
    setClientMode("existing")
    setOpen(true)
  }

  async function onSubmit(data: FormValues) {
    setLoading(true)
    let clientId = data.client_id || undefined

    if (clientMode === "new" && data.new_client_name?.trim()) {
      const { data: newClient, error } = await createClient2({ name: data.new_client_name.trim() })
      if (error) { toast.error(error); setLoading(false); return }
      clientId = newClient!.id
      setClients((prev) => [...prev, newClient as Client])
    }

    const payload: EventFormData = {
      name: data.name,
      client_id: clientId,
      event_type: data.event_type || undefined,
      event_date: data.event_date,
      event_time: data.event_time || undefined,
      location: data.location || undefined,
      guest_count: data.guest_count,
      notes: data.notes || undefined,
    }

    const { data: created, error } = await createEvent(payload)
    if (error) { toast.error(error); setLoading(false); return }
    toast.success("Evento creado")
    setOpen(false)
    setLoading(false)
    router.push(`/eventos/${created!.id}`)
  }

  const filtered = events.filter((e) => {
    const matchStatus = statusFilter === "all" || e.status === statusFilter
    const q = search.toLowerCase()
    const matchSearch = !q || e.name.toLowerCase().includes(q) ||
      (e.clients?.name ?? "").toLowerCase().includes(q) ||
      (e.location ?? "").toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar evento o cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 font-sans h-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
            <SelectTrigger className="font-sans h-9 w-44">
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-sans">Todos</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <SelectItem key={k} value={k} className="font-sans">{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openCreate} className="bg-gold hover:bg-gold-dark text-ink font-sans font-medium">
          <Plus size={16} className="mr-1" /> Nuevo evento
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={search || statusFilter !== "all" ? "Sin resultados" : "Sin eventos"}
          description={search || statusFilter !== "all"
            ? "Prueba con otros filtros o términos de búsqueda."
            : "Crea tu primer evento para comenzar el flujo de trabajo."}
          action={!search && statusFilter === "all" ? { label: "Crear evento", onClick: openCreate } : undefined}
        />
      ) : (
        <div className="enterprise-card overflow-hidden divide-y divide-border">
          {filtered.map((event) => {
            const cfg = STATUS_CONFIG[event.status]
            const d = new Date(event.event_date + "T12:00:00")
            return (
              <div
                key={event.id}
                onClick={() => router.push(`/eventos/${event.id}`)}
                className="w-full text-left flex items-center gap-4 px-4 py-3 table-row-hover cursor-pointer"
              >
                <div className="w-10 text-center shrink-0">
                  <p className="mono-data" style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--text-1)", lineHeight: 1 }}>{d.getDate()}</p>
                  <p style={{ fontFamily: "var(--font-mono), ui-monospace, monospace", fontSize: "0.52rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-3)", marginTop: "0.2rem" }}>
                    {d.toLocaleDateString("es-MX", { month: "short" })}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "0.9375rem", fontWeight: 500, color: "var(--text-1)", letterSpacing: "0.01em", lineHeight: 1.3 }} className="truncate">{event.name}</p>
                  <p style={{ fontFamily: "var(--font-sans), system-ui, sans-serif", fontSize: "0.7rem", color: "var(--text-2)" }} className="truncate mt-0.5">
                    {event.clients?.name ?? "Sin cliente"}
                    {event.guest_count ? ` · ${event.guest_count} inv.` : ""}
                    {event.location ? ` · ${event.location}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {event.event_type && (
                    <span style={{ fontFamily: "var(--font-mono), ui-monospace, monospace", fontSize: "0.62rem", color: "var(--text-3)", letterSpacing: "0.06em" }} className="hidden md:block">{event.event_type}</span>
                  )}
                  {cfg && (
                    <span className={`status-pill ${cfg.bg} ${cfg.text}`} style={{ borderRadius: "4px" }}>
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  )}
                  <a
                    href={googleCalendarEventUrl({
                      title: event.name,
                      startDate: event.event_date,
                      location: event.location ?? undefined,
                      details: `Cliente: ${event.clients?.name ?? "—"}\nInvitados: ${event.guest_count}`,
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title="Agregar a Google Calendar"
                    className="text-muted-foreground/50 hover:text-gold transition-colors p-0.5 rounded"
                  >
                    <Calendar size={13} />
                  </a>
                  <ChevronRight size={14} className="text-muted-foreground/40" />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs font-sans text-muted-foreground">
            Página {page} de {totalPages}
            {totalCount ? ` · ${totalCount} eventos en total` : ""}
          </p>
          <div className="flex gap-1.5">
            {page > 1 && (
              <Link
                href={`/eventos?page=${page - 1}`}
                className="inline-flex items-center h-7 rounded-md border border-border bg-card px-3 text-xs font-sans text-muted-foreground hover:text-foreground hover:border-gold/40 transition-colors"
              >
                ← Anterior
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/eventos?page=${page + 1}`}
                className="inline-flex items-center h-7 rounded-md border border-border bg-card px-3 text-xs font-sans text-muted-foreground hover:text-foreground hover:border-gold/40 transition-colors"
              >
                Siguiente →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Create event dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Nuevo evento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="font-sans">Nombre del evento *</Label>
              <Input {...register("name")} placeholder="Ej. Boda García–Sánchez" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            {/* Client */}
            <div className="space-y-2">
              <Label className="font-sans">Cliente</Label>
              <div className="flex gap-2">
                <Button
                  type="button" size="sm" variant={clientMode === "existing" ? "default" : "outline"}
                  className="font-sans text-xs"
                  onClick={() => setClientMode("existing")}
                >Existente</Button>
                <Button
                  type="button" size="sm" variant={clientMode === "new" ? "default" : "outline"}
                  className="font-sans text-xs"
                  onClick={() => setClientMode("new")}
                >Nuevo</Button>
              </div>
              {clientMode === "existing" ? (
                <Select value={watchClientId} onValueChange={(v) => setValue("client_id", v ?? "")}>
                  <SelectTrigger className="font-sans"><SelectValue placeholder="Selecciona cliente" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="" className="font-sans">Sin cliente</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="font-sans">{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input {...register("new_client_name")} placeholder="Nombre del nuevo cliente" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
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
                <Label className="font-sans">Invitados *</Label>
                <Input {...register("guest_count", { valueAsNumber: true })} type="number" min="1" placeholder="1" />
                {errors.guest_count && <p className="text-xs text-destructive">{errors.guest_count.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-sans">Fecha *</Label>
                <Input {...register("event_date")} type="date" />
                {errors.event_date && <p className="text-xs text-destructive">{errors.event_date.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="font-sans">Hora</Label>
                <Input {...register("event_time")} type="time" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="font-sans">Lugar</Label>
              <Input {...register("location")} placeholder="Ej. Hacienda Las Flores, Querétaro" />
            </div>

            <div className="space-y-1.5">
              <Label className="font-sans">Notas</Label>
              <Textarea {...register("notes")} placeholder="Requerimientos especiales, restricciones, etc." rows={2} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="font-sans">Cancelar</Button>
              <Button type="submit" disabled={loading} className="bg-gold hover:bg-gold-dark text-ink font-sans font-medium">
                {loading ? "Creando…" : "Crear evento"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export { formatDate, formatShortDate }
