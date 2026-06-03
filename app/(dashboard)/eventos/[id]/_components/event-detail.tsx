"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  CalendarDays, MapPin, Users, ChevronRight, Pencil, Check, X,
  ArrowLeft, FileText, ClipboardList, Plus, Trash2, Calendar,
  Package, ShoppingCart
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { formatCurrency, formatDate, formatShortDate, googleCalendarEventUrl } from "@/lib/utils"
import { EVENT_TYPES } from "@/lib/constants"
import { updateEvent, updateEventStatus, deleteEvent, createClient2 } from "../../actions"
import { upsertQuote, updateQuoteStatus, generateContract, updateContract } from "../quote-actions"
import { createMilestone, updateMilestone, markMilestonePaid, markMilestonePending, deleteMilestone, type MilestoneFormData } from "../payment-actions"
import { generateRequisition, updateRequisitionStatus, deleteRequisition, generatePurchaseOrders, updatePOStatus } from "../requisition-actions"
import { sendQuoteEmail, sendContractEmail } from "@/app/actions/send-email"
import { ComprasTab } from "./compras-tab"
import { PersonalTab } from "./personal-tab"

// ── types ─────────────────────────────────────────────────────────────────────

type Client = { id: string; name: string; phone: string | null; email: string | null }

type Dish = {
  id: string
  name: string
  category: string | null
  servings_yield: number
  recipe_items: { quantity: number; ingredients: { current_price: number } | null }[]
}

type LineItem = {
  id: string
  type: string
  reference_id: string | null
  description: string
  unit_cost: number
  quantity: number
  total_cost: number
  sort_order: number
}

type Quote = {
  id: string
  version_number: number
  status: string
  subtotal: number
  discount_amount: number
  total: number
  margin_percent: number | null
  notes: string | null
  quote_line_items: LineItem[]
}

type PaymentMilestone = {
  id: string
  description: string
  amount: number
  due_date: string
  status: string
  paid_at: string | null
  paid_amount: number | null
  reference: string | null
  notes: string | null
  sort_order: number
}

type ContractClause = { id: string; title: string; content: string }

type RequisitionItem = {
  id: string
  ingredient_id: string
  quantity: number
  unit: string
  unit_cost: number
  total_cost: number
  notes: string | null
  ingredients: { id: string; name: string; unit: string; current_price: number; preferred_supplier_id: string | null } | null
}

type Requisition = {
  id: string
  status: string
  notes: string | null
  created_at: string
  requisition_items: RequisitionItem[]
}

type POItem = {
  id: string
  ingredient_id: string
  quantity: number
  unit: string
  unit_cost: number
  total_cost: number
  received_quantity: number | null
  ingredients: { name: string; unit: string } | null
}

type PurchaseOrder = {
  id: string
  supplier_id: string | null
  status: string
  buy_by_date: string | null
  received_at: string | null
  subtotal: number
  notes: string | null
  suppliers: { name: string; email: string | null; phone: string | null } | null
  purchase_order_items: POItem[]
}

type Contract = {
  id: string
  quote_id: string | null
  clauses: ContractClause[]
  status: string
  signed_at: string | null
  notes: string | null
}

type Event = {
  id: string
  name: string
  event_type: string | null
  event_date: string
  event_time: string | null
  location: string | null
  guest_count: number
  status: string
  notes: string | null
  clients: Client | null
}

// ── status config ─────────────────────────────────────────────────────────────

const EVENT_STATUSES = [
  { key: "cotizado",       label: "Cotizado",       className: "bg-blue-100 text-blue-800 border-blue-200" },
  { key: "contratado",     label: "Contratado",     className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { key: "en_requisicion", label: "En requisición", className: "bg-amber-100 text-amber-800 border-amber-200" },
  { key: "en_compras",     label: "En compras",     className: "bg-orange-100 text-orange-800 border-orange-200" },
  { key: "completado",     label: "Completado",     className: "bg-sage/20 text-sage border-sage/30" },
  { key: "cancelado",      label: "Cancelado",      className: "bg-red-100 text-red-800 border-red-200" },
]

const QUOTE_STATUS: Record<string, { label: string; className: string }> = {
  borrador:  { label: "Borrador",  className: "bg-muted text-muted-foreground" },
  enviada:   { label: "Enviada",   className: "bg-blue-100 text-blue-800" },
  aprobada:  { label: "Aprobada",  className: "bg-emerald-100 text-emerald-800" },
  rechazada: { label: "Rechazada", className: "bg-red-100 text-red-800" },
}

// ── edit event schema ─────────────────────────────────────────────────────────

const editSchema = z.object({
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
type EditValues = z.infer<typeof editSchema>

// ── main component ────────────────────────────────────────────────────────────

type ActualPurchase = {
  id: string
  ingredient_id: string
  quantity: number
  unit: string
  unit_cost: number
  total_cost: number
  purchased_at: string
  notes: string | null
  ingredients: { name: string; unit: string } | null
}

type IndirectCostCategory = {
  id: string
  name: string
  allocation_method: string
  default_amount: number
}

type StaffMemberCatalog = {
  id: string
  name: string
  position: string
  rate: number
  rate_type: string
  phone: string | null
}

type StaffAssignment = {
  id: string
  staff_member_id: string
  role: string | null
  call_time: string | null
  estimated_hours: number
  computed_cost: number
  notes: string | null
  staff_members: StaffMemberCatalog | null
}

type EventIndirectCost = {
  id: string
  category_id: string
  amount: number
  notes: string | null
  indirect_cost_categories: IndirectCostCategory | null
}

type TabKey = "resumen" | "cotizacion" | "contrato" | "pagos" | "requisicion" | "compras" | "personal"
const VALID_TABS: TabKey[] = ["resumen", "cotizacion", "contrato", "pagos", "requisicion", "compras", "personal"]

type Props = {
  event: Event
  quote: Quote | null
  contract: Contract | null
  dishes: Dish[]
  clients: Client[]
  payments: PaymentMilestone[]
  requisition: Requisition | null
  purchaseOrders: PurchaseOrder[]
  actualPurchases: ActualPurchase[]
  indirectCosts: EventIndirectCost[]
  indirectCostCategories: IndirectCostCategory[]
  staffAssignments: StaffAssignment[]
  staffMembers: StaffMemberCatalog[]
  initialTab?: TabKey
}

function EmailButton({ action, id, label }: { action: "quote" | "contract"; id: string; label: string }) {
  const [pending, startTransition] = useTransition()
  function send() {
    startTransition(async () => {
      const fn = action === "quote" ? sendQuoteEmail : sendContractEmail
      const { error } = await fn(id)
      if (error) toast.error(error)
      else toast.success("Correo enviado al cliente")
    })
  }
  return (
    <button
      onClick={send}
      disabled={pending}
      className="inline-flex items-center gap-1.5 h-7 rounded-md border border-border bg-background px-2.5 text-xs font-sans text-foreground hover:bg-muted hover:border-gold/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
      {pending ? "Enviando…" : label}
    </button>
  )
}

export function EventDetail({ event: initial, quote: initialQuote, contract: initialContract, dishes, clients: initialClients, payments: initialPayments, requisition: initialRequisition, purchaseOrders: initialPOs, actualPurchases, indirectCosts, indirectCostCategories, staffAssignments, staffMembers, initialTab }: Props) {
  const router = useRouter()
  const [event, setEvent] = useState(initial)
  const [quote, setQuote] = useState(initialQuote)
  const [contract, setContract] = useState(initialContract)
  const [clients, setClients] = useState(initialClients)
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab ?? "resumen")
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [clientMode, setClientMode] = useState<"existing" | "new">("existing")

  // quote builder local state
  const [lineItems, setLineItems] = useState<Omit<LineItem, "id" | "total_cost">[]>(
    (initialQuote?.quote_line_items ?? []).map((li) => ({
      type: li.type,
      reference_id: li.reference_id,
      description: li.description,
      unit_cost: li.unit_cost,
      quantity: li.quantity,
      sort_order: li.sort_order,
    }))
  )
  const [discount, setDiscount] = useState(initialQuote?.discount_amount ?? 0)
  const [marginPercent, setMarginPercent] = useState<number | "">(initialQuote?.margin_percent ?? "")
  const [quoteNotes, setQuoteNotes] = useState(initialQuote?.notes ?? "")
  const [savingQuote, setSavingQuote] = useState(false)

  // contract clause edit state
  const [contractClauses, setContractClauses] = useState<ContractClause[]>(
    initialContract?.clauses ?? []
  )
  const [savingContract, setSavingContract] = useState(false)

  // requisition + PO state
  const [requisition, setRequisition] = useState<Requisition | null>(initialRequisition)
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(initialPOs)
  const [generatingReq, setGeneratingReq] = useState(false)
  const [generatingPOs, setGeneratingPOs] = useState(false)
  const [expandedPO, setExpandedPO] = useState<string | null>(null)

  // payment state
  const [payments, setPayments] = useState<PaymentMilestone[]>(initialPayments)
  const [payOpen, setPayOpen] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<PaymentMilestone | null>(null)
  const [payForm, setPayForm] = useState({ description: "", amount: "", due_date: "", notes: "" })
  const [markPaidOpen, setMarkPaidOpen] = useState<PaymentMilestone | null>(null)
  const [paidForm, setPaidForm] = useState({ paid_at: new Date().toISOString().slice(0, 10), paid_amount: "", reference: "" })
  const [savingPayment, setSavingPayment] = useState(false)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
  })
  const watchClientId = watch("client_id")
  const watchEventType = watch("event_type")

  // ── event edit ────────────────────────────────────────────────────────────

  function openEdit() {
    reset({
      name: event.name,
      client_id: event.clients?.id ?? "",
      event_type: event.event_type ?? "",
      event_date: event.event_date,
      event_time: event.event_time ?? "",
      location: event.location ?? "",
      guest_count: event.guest_count,
      notes: event.notes ?? "",
    })
    setClientMode("existing")
    setEditOpen(true)
  }

  async function onEditSubmit(data: EditValues) {
    setLoading(true)
    let clientId = data.client_id || undefined
    let resolvedClient: Client | null = null

    if (clientMode === "new" && data.new_client_name?.trim()) {
      const { data: created, error } = await createClient2({ name: data.new_client_name.trim() })
      if (error) { toast.error(error); setLoading(false); return }
      clientId = created!.id
      resolvedClient = created as Client
      setClients((prev) => [...prev, resolvedClient!])
    } else {
      resolvedClient = clients.find((c) => c.id === clientId) ?? null
    }

    const { data: updated, error } = await updateEvent(event.id, {
      name: data.name,
      client_id: clientId,
      event_type: data.event_type || undefined,
      event_date: data.event_date,
      event_time: data.event_time || undefined,
      location: data.location || undefined,
      guest_count: data.guest_count,
      notes: data.notes || undefined,
      status: event.status,
    })
    if (error) { toast.error(error); setLoading(false); return }
    setEvent({ ...event, ...(updated as Partial<Event>), clients: resolvedClient })
    toast.success("Evento actualizado")
    setEditOpen(false)
    setLoading(false)
  }

  async function handleStatusChange(status: string) {
    const { error } = await updateEventStatus(event.id, status)
    if (error) { toast.error(error); return }
    setEvent((prev) => ({ ...prev, status }))
    toast.success("Estado actualizado")
  }

  async function handleDelete() {
    setLoading(true)
    const { error } = await deleteEvent(event.id)
    if (error) { toast.error(error); setLoading(false); return }
    toast.success("Evento eliminado")
    router.push("/eventos")
  }

  // ── quote builder ─────────────────────────────────────────────────────────

  function dishCostPerServing(dish: Dish) {
    const total = dish.recipe_items.reduce((s, r) => s + (r.ingredients?.current_price ?? 0) * r.quantity, 0)
    return dish.servings_yield > 0 ? total / dish.servings_yield : 0
  }

  function addDishLine(dish: Dish) {
    const costPerServing = dishCostPerServing(dish)
    setLineItems((prev) => [...prev, {
      type: "dish",
      reference_id: dish.id,
      description: `${dish.name}${dish.category ? ` (${dish.category})` : ""} × ${event.guest_count} porciones`,
      unit_cost: costPerServing,
      quantity: event.guest_count,
      sort_order: prev.length,
    }])
  }

  function addManualLine() {
    setLineItems((prev) => [...prev, {
      type: "other",
      reference_id: null,
      description: "",
      unit_cost: 0,
      quantity: 1,
      sort_order: prev.length,
    }])
  }

  function updateLine(index: number, field: string, value: string | number) {
    setLineItems((prev) => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ))
  }

  function removeLine(index: number) {
    setLineItems((prev) => prev.filter((_, i) => i !== index))
  }

  const subtotal = lineItems.reduce((s, i) => s + i.unit_cost * i.quantity, 0)
  const total = Math.max(0, subtotal - discount)

  async function saveQuote() {
    setSavingQuote(true)
    const { data, error } = await upsertQuote(event.id, {
      discount_amount: discount,
      margin_percent: marginPercent !== "" ? Number(marginPercent) : undefined,
      notes: quoteNotes || undefined,
      items: lineItems.map((item, i) => ({
        type: item.type,
        reference_id: item.reference_id ?? undefined,
        description: item.description,
        unit_cost: item.unit_cost,
        quantity: item.quantity,
        sort_order: i,
      })),
    })
    if (error) { toast.error(error); setSavingQuote(false); return }
    setQuote((prev) => prev
      ? { ...prev, subtotal, discount_amount: discount, total, margin_percent: marginPercent !== "" ? Number(marginPercent) : null, notes: quoteNotes, quote_line_items: lineItems.map((li, i) => ({ ...li, id: `temp-${i}`, total_cost: li.unit_cost * li.quantity })) }
      : { id: data!.id, version_number: 1, status: "borrador", subtotal, discount_amount: discount, total, margin_percent: marginPercent !== "" ? Number(marginPercent) : null, notes: quoteNotes, quote_line_items: [] }
    )
    toast.success("Cotización guardada")
    setSavingQuote(false)
  }

  async function handleQuoteStatus(status: string) {
    if (!quote) return
    const { error } = await updateQuoteStatus(quote.id, event.id, status)
    if (error) { toast.error(error); return }
    setQuote((prev) => prev ? { ...prev, status } : prev)
    toast.success("Estado de cotización actualizado")
    if (status === "aprobada") {
      handleStatusChange("contratado")
    }
  }

  // ── contract ──────────────────────────────────────────────────────────────

  async function handleGenerateContract() {
    if (!quote) { toast.error("Guarda la cotización primero"); return }
    setSavingContract(true)
    const { data, error } = await generateContract(event.id, quote.id)
    if (error) { toast.error(error); setSavingContract(false); return }
    setContract(data as Contract)
    setContractClauses((data as Contract).clauses)
    toast.success("Contrato generado")
    setSavingContract(false)
  }

  async function saveContract() {
    if (!contract) return
    setSavingContract(true)
    const { error } = await updateContract(contract.id, event.id, { clauses: contractClauses })
    if (error) { toast.error(error); setSavingContract(false); return }
    toast.success("Contrato guardado")
    setSavingContract(false)
  }

  async function signContract() {
    if (!contract) return
    setSavingContract(true)
    const { error } = await updateContract(contract.id, event.id, { clauses: contractClauses, status: "firmado" })
    if (error) { toast.error(error); setSavingContract(false); return }
    setContract((prev) => prev ? { ...prev, status: "firmado", signed_at: new Date().toISOString() } : prev)
    toast.success("Contrato marcado como firmado")
    setSavingContract(false)
  }

  // ── payments ──────────────────────────────────────────────────────────────

  function computePaymentStatus(p: PaymentMilestone) {
    if (p.status === "pagado") return "pagado"
    const today = new Date().toISOString().slice(0, 10)
    return p.due_date < today ? "vencido" : "pendiente"
  }

  function openNewMilestone() {
    setEditingMilestone(null)
    setPayForm({ description: "", amount: "", due_date: "", notes: "" })
    setPayOpen(true)
  }

  function openEditMilestone(p: PaymentMilestone) {
    setEditingMilestone(p)
    setPayForm({ description: p.description, amount: String(p.amount), due_date: p.due_date, notes: p.notes ?? "" })
    setPayOpen(true)
  }

  async function saveMilestone() {
    if (!payForm.description || !payForm.amount || !payForm.due_date) {
      toast.error("Completa todos los campos requeridos"); return
    }
    setSavingPayment(true)
    const data: MilestoneFormData = {
      description: payForm.description,
      amount: Number(payForm.amount),
      due_date: payForm.due_date,
      notes: payForm.notes || undefined,
      sort_order: payments.length,
    }
    if (editingMilestone) {
      const { error } = await updateMilestone(editingMilestone.id, event.id, data)
      if (error) { toast.error(error); setSavingPayment(false); return }
      setPayments((prev) => prev.map((p) => p.id === editingMilestone.id ? { ...p, ...data } : p))
      toast.success("Hito actualizado")
    } else {
      const { data: created, error } = await createMilestone(event.id, data)
      if (error) { toast.error(error); setSavingPayment(false); return }
      setPayments((prev) => [...prev, created as unknown as PaymentMilestone])
      toast.success("Hito creado")
    }
    setPayOpen(false)
    setSavingPayment(false)
  }

  async function handleMarkPaid() {
    if (!markPaidOpen) return
    setSavingPayment(true)
    const { error } = await markMilestonePaid(
      markPaidOpen.id, event.id,
      paidForm.paid_at,
      Number(paidForm.paid_amount) || markPaidOpen.amount,
      paidForm.reference || undefined
    )
    if (error) { toast.error(error); setSavingPayment(false); return }
    setPayments((prev) => prev.map((p) => p.id === markPaidOpen.id
      ? { ...p, status: "pagado", paid_at: paidForm.paid_at, paid_amount: Number(paidForm.paid_amount) || p.amount, reference: paidForm.reference || null }
      : p
    ))
    toast.success("Pago registrado")
    setMarkPaidOpen(null)
    setSavingPayment(false)
  }

  async function handleUnmarkPaid(p: PaymentMilestone) {
    const { error } = await markMilestonePending(p.id, event.id)
    if (error) { toast.error(error); return }
    setPayments((prev) => prev.map((m) => m.id === p.id
      ? { ...m, status: "pendiente", paid_at: null, paid_amount: null, reference: null }
      : m
    ))
    toast.success("Pago revertido a pendiente")
  }

  async function handleDeleteMilestone(p: PaymentMilestone) {
    const { error } = await deleteMilestone(p.id, event.id)
    if (error) { toast.error(error); return }
    setPayments((prev) => prev.filter((m) => m.id !== p.id))
    toast.success("Hito eliminado")
  }

  // ── requisition ───────────────────────────────────────────────────────────

  async function handleGenerateRequisition() {
    setGeneratingReq(true)
    const { data, error } = await generateRequisition(event.id)
    if (error) { toast.error(error); setGeneratingReq(false); return }
    setRequisition(data as unknown as Requisition)
    toast.success("Requisición generada")
    setGeneratingReq(false)
  }

  async function handleRequisitionStatus(status: string) {
    if (!requisition) return
    const { error } = await updateRequisitionStatus(requisition.id, event.id, status)
    if (error) { toast.error(error); return }
    setRequisition((prev) => prev ? { ...prev, status } : prev)
    toast.success("Estado actualizado")
  }

  async function handleDeleteRequisition() {
    if (!requisition) return
    const { error } = await deleteRequisition(requisition.id, event.id)
    if (error) { toast.error(error); return }
    setRequisition(null)
    setPurchaseOrders([])
    toast.success("Requisición eliminada")
  }

  async function handleGeneratePOs() {
    if (!requisition) return
    setGeneratingPOs(true)
    const { data, error } = await generatePurchaseOrders(requisition.id, event.id)
    if (error) { toast.error(error); setGeneratingPOs(false); return }
    setPurchaseOrders(data as unknown as PurchaseOrder[])
    toast.success(`${(data ?? []).length} orden(es) de compra generadas`)
    setGeneratingPOs(false)
  }

  async function handlePOStatus(po: PurchaseOrder, status: string) {
    const receivedAt = status === "recibida" ? new Date().toISOString().slice(0, 10) : undefined
    const { error } = await updatePOStatus(po.id, event.id, status, receivedAt)
    if (error) { toast.error(error); return }
    setPurchaseOrders((prev) => prev.map((p) =>
      p.id === po.id ? { ...p, status, received_at: receivedAt ?? null } : p
    ))
    toast.success("Estado de orden actualizado")
  }

  // ── render ────────────────────────────────────────────────────────────────

  const statusCfg = EVENT_STATUSES.find((s) => s.key === event.status)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <button onClick={() => router.push("/eventos")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-sans">
          <ArrowLeft size={14} /> Todos los eventos
        </button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-heading text-2xl font-bold text-ink">{event.name}</h1>
              {statusCfg && (
                <Badge variant="secondary" className={`font-sans text-xs border ${statusCfg.className}`}>
                  {statusCfg.label}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground font-sans flex-wrap">
              {event.clients && (
                <span className="font-medium text-foreground">{event.clients.name}</span>
              )}
              <span className="flex items-center gap-1">
                <CalendarDays size={13} />
                {formatDate(event.event_date)}
                {event.event_time && ` · ${event.event_time.slice(0, 5)}`}
              </span>
              {event.location && (
                <span className="flex items-center gap-1"><MapPin size={13} />{event.location}</span>
              )}
              <span className="flex items-center gap-1"><Users size={13} />{event.guest_count} invitados</span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <a
              href={googleCalendarEventUrl({
                title: event.name,
                startDate: event.event_date,
                startTime: event.event_time?.slice(0, 5),
                location: event.location ?? undefined,
                details: `Cliente: ${event.clients?.name ?? "—"}\nInvitados: ${event.guest_count}${event.notes ? `\n${event.notes}` : ""}`,
              })}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="sm" variant="outline" className="font-sans">
                <Calendar size={14} className="mr-1" /> Google Calendar
              </Button>
            </a>
            <Button size="sm" variant="outline" onClick={openEdit} className="font-sans">
              <Pencil size={14} className="mr-1" /> Editar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setDeleteOpen(true)} className="font-sans text-destructive hover:text-destructive">
              Eliminar
            </Button>
          </div>
        </div>

        {/* Status progression */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {EVENT_STATUSES.filter((s) => s.key !== "cancelado").map((s, i, arr) => {
            const isCurrent = s.key === event.status
            const statusKeys = arr.map((x) => x.key)
            const currentIndex = statusKeys.indexOf(event.status)
            const isPast = i < currentIndex
            return (
              <div key={s.key} className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleStatusChange(s.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-sans font-medium transition-colors border ${
                    isCurrent ? `${s.className} cursor-default` :
                    isPast ? "bg-muted text-muted-foreground border-transparent hover:border-border" :
                    "text-muted-foreground border-transparent hover:bg-muted hover:border-border"
                  }`}
                >
                  {s.label}
                </button>
                {i < arr.length - 1 && <ChevronRight size={12} className="text-muted-foreground" />}
              </div>
            )
          })}
          <button
            onClick={() => handleStatusChange("cancelado")}
            className={`ml-2 px-3 py-1.5 rounded-full text-xs font-sans font-medium transition-colors border ${
              event.status === "cancelado"
                ? "bg-red-100 text-red-800 border-red-200"
                : "text-muted-foreground border-transparent hover:bg-red-50 hover:text-red-700"
            }`}
          >
            Cancelado
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-0">
          {(["resumen", "cotizacion", "contrato", "pagos", "requisicion", "compras", "personal"] as const).map((tab) => {
            const label = tab === "cotizacion" ? "Cotización" : tab === "contrato" ? "Contrato" : tab === "pagos" ? "Pagos" : tab === "requisicion" ? "Requisición" : tab === "compras" ? "Compras" : tab === "personal" ? "Personal" : "Resumen"
            const overdueCount = tab === "pagos" ? payments.filter((p) => computePaymentStatus(p) === "vencido").length : 0
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-4 py-2.5 text-sm font-sans font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-gold text-ink"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
                {overdueCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-sans font-bold">
                    {overdueCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab: Resumen */}
      {activeTab === "resumen" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="rounded-lg border border-border p-4 space-y-1">
            <p className="text-xs font-sans uppercase tracking-wider text-muted-foreground">Cliente</p>
            <p className="font-medium">{event.clients?.name ?? "—"}</p>
            {event.clients?.phone && (
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground font-sans">{event.clients.phone}</p>
                <a
                  href={`https://wa.me/${event.clients.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${event.clients.name}, te contactamos respecto a tu evento *${event.name}* del ${new Date(event.event_date).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-sans transition-colors" style={{ color: "#34d399" }}
                  title="Enviar WhatsApp"
                >
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </a>
              </div>
            )}
            {event.clients?.email && <p className="text-sm text-muted-foreground font-sans">{event.clients.email}</p>}
          </div>
          <div className="rounded-lg border border-border p-4 space-y-1">
            <p className="text-xs font-sans uppercase tracking-wider text-muted-foreground">Evento</p>
            <p className="font-medium">{event.event_type ?? "—"}</p>
            <p className="text-sm text-muted-foreground font-sans">{formatDate(event.event_date)}{event.event_time ? ` · ${event.event_time.slice(0, 5)}` : ""}</p>
          </div>
          <div className="rounded-lg border border-border p-4 space-y-1">
            <p className="text-xs font-sans uppercase tracking-wider text-muted-foreground">Cotización</p>
            {quote ? (
              <>
                <p className="font-medium tabular-nums">{formatCurrency(quote.total)}</p>
                <Badge variant="secondary" className={`font-sans text-xs ${QUOTE_STATUS[quote.status]?.className ?? ""}`}>
                  {QUOTE_STATUS[quote.status]?.label ?? quote.status}
                </Badge>
              </>
            ) : (
              <p className="text-sm text-muted-foreground font-sans">Sin cotización</p>
            )}
          </div>
          {event.location && (
            <div className="rounded-lg border border-border p-4 space-y-1">
              <p className="text-xs font-sans uppercase tracking-wider text-muted-foreground">Lugar</p>
              <p className="font-medium">{event.location}</p>
            </div>
          )}
          <div className="rounded-lg border border-border p-4 space-y-1">
            <p className="text-xs font-sans uppercase tracking-wider text-muted-foreground">Invitados</p>
            <p className="font-medium">{event.guest_count} personas</p>
          </div>
          {event.notes && (
            <div className="rounded-lg border border-border p-4 space-y-1 sm:col-span-2">
              <p className="text-xs font-sans uppercase tracking-wider text-muted-foreground">Notas</p>
              <p className="text-sm font-sans">{event.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Cotización */}
      {activeTab === "cotizacion" && (
        <div className="space-y-5">
          {/* Quote status bar */}
          {quote && (
            <div className="flex items-center justify-between flex-wrap gap-3 rounded-lg border border-border p-3">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className={`font-sans text-xs ${QUOTE_STATUS[quote.status]?.className ?? ""}`}>
                  {QUOTE_STATUS[quote.status]?.label ?? quote.status}
                </Badge>
                <span className="text-sm font-sans text-muted-foreground">v{quote.version_number}</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {quote.status === "borrador" && (
                  <Button size="sm" variant="outline" className="font-sans text-xs" onClick={() => handleQuoteStatus("enviada")}>
                    Marcar como enviada
                  </Button>
                )}
                {quote.status === "enviada" && (
                  <>
                    <Button size="sm" className="font-sans text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleQuoteStatus("aprobada")}>
                      <Check size={13} className="mr-1" /> Aprobar
                    </Button>
                    <Button size="sm" variant="outline" className="font-sans text-xs text-destructive" onClick={() => handleQuoteStatus("rechazada")}>
                      <X size={13} className="mr-1" /> Rechazar
                    </Button>
                  </>
                )}
                {(quote.status === "aprobada" || quote.status === "rechazada") && (
                  <Button size="sm" variant="outline" className="font-sans text-xs" onClick={() => handleQuoteStatus("borrador")}>
                    Volver a borrador
                  </Button>
                )}
                <a
                  href={`/api/pdf/quote/${quote.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 h-7 rounded-md border border-border bg-background px-2.5 text-xs font-sans text-foreground hover:bg-muted hover:border-gold/40 transition-colors"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  PDF
                </a>
                <EmailButton
                  action="quote"
                  id={quote.id}
                  label="Enviar al cliente"
                />
                {event.clients?.phone && (
                  <a
                    href={`https://wa.me/${event.clients.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                      `Hola ${event.clients?.name ?? ""}, te comparto la cotización para tu evento *${event.name}*.\n\n` +
                      `📅 Fecha: ${new Date(event.event_date).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}\n` +
                      `👥 Invitados: ${event.guest_count}\n` +
                      `💰 Total: ${new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(quote.total)}\n\n` +
                      `Quedamos a tus órdenes.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 h-7 rounded-md border px-2.5 text-xs font-sans transition-colors" style={{ borderColor: "rgb(52 211 153 / 0.25)", background: "rgb(52 211 153 / 0.08)", color: "#34d399" }}
                  >
                    <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    WhatsApp
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Line items editor */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-sm font-semibold">Partidas</h3>
              <div className="flex gap-2">
                {/* Add dish selector */}
                <Select onValueChange={(v) => {
                  const dish = dishes.find((d) => d.id === (v ?? ""))
                  if (dish) addDishLine(dish)
                }}>
                  <SelectTrigger className="font-sans h-8 text-xs w-48">
                    <SelectValue placeholder="+ Agregar platillo" />
                  </SelectTrigger>
                  <SelectContent>
                    {dishes.map((d) => (
                      <SelectItem key={d.id} value={d.id} className="font-sans text-sm">
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" size="sm" variant="outline" className="font-sans text-xs h-8" onClick={addManualLine}>
                  <Plus size={12} className="mr-1" /> Línea manual
                </Button>
              </div>
            </div>

            {lineItems.length > 0 ? (
              <div className="rounded-md border border-border overflow-hidden">
                <div className="grid grid-cols-[1fr_100px_100px_100px_28px] gap-2 px-3 py-2 bg-muted/40 text-xs font-sans font-semibold uppercase tracking-wider text-muted-foreground">
                  <span>Descripción</span><span>Precio unit.</span><span>Cant.</span><span className="text-right">Total</span><span />
                </div>
                {lineItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-[1fr_100px_100px_100px_28px] gap-2 px-3 py-2 border-t border-border items-center">
                    <Input
                      value={item.description}
                      onChange={(e) => updateLine(index, "description", e.target.value)}
                      placeholder="Descripción del concepto"
                      className="h-8 text-sm font-sans border-transparent bg-transparent focus:bg-background focus:border-border px-0 focus:px-2"
                    />
                    <Input
                      type="number" step="0.01" min="0"
                      value={item.unit_cost}
                      onChange={(e) => updateLine(index, "unit_cost", Number(e.target.value))}
                      className="h-8 text-sm font-sans tabular-nums"
                    />
                    <Input
                      type="number" step="0.01" min="0"
                      value={item.quantity}
                      onChange={(e) => updateLine(index, "quantity", Number(e.target.value))}
                      className="h-8 text-sm font-sans tabular-nums"
                    />
                    <span className="text-sm font-sans tabular-nums text-right font-medium">
                      {formatCurrency(item.unit_cost * item.quantity)}
                    </span>
                    <button type="button" onClick={() => removeLine(index)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-border p-8 text-center">
                <FileText size={24} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-sans text-muted-foreground">Agrega platillos o partidas manuales</p>
              </div>
            )}

            {/* Totals */}
            {lineItems.length > 0 && (
              <div className="flex justify-end">
                <div className="space-y-2 min-w-64">
                  <div className="flex justify-between text-sm font-sans">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="tabular-nums">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-sans">
                    <span className="text-muted-foreground">Descuento</span>
                    <Input
                      type="number" step="0.01" min="0"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="h-7 w-32 text-sm font-sans tabular-nums text-right"
                    />
                  </div>
                  <Separator />
                  <div className="flex justify-between text-base font-sans font-semibold">
                    <span>Total</span>
                    <span className="tabular-nums">{formatCurrency(total)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-sans text-muted-foreground">
                    <span>Margen objetivo (%)</span>
                    <Input
                      type="number" step="0.1" min="0" max="100"
                      value={marginPercent}
                      onChange={(e) => setMarginPercent(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="—"
                      className="h-7 w-20 text-sm font-sans tabular-nums text-right"
                    />
                  </div>
                  {marginPercent !== "" && marginPercent > 0 && (
                    <p className="text-xs font-sans text-muted-foreground text-right">
                      Precio sugerido: {formatCurrency(total / (1 - Number(marginPercent) / 100))}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quote notes */}
          <div className="space-y-1.5">
            <Label className="font-sans">Notas de la cotización</Label>
            <Textarea value={quoteNotes} onChange={(e) => setQuoteNotes(e.target.value)} placeholder="Condiciones, vigencia, notas adicionales..." rows={2} />
          </div>

          <div className="flex justify-end gap-2">
            <Button onClick={saveQuote} disabled={savingQuote} className="bg-gold hover:bg-gold-dark text-ink font-sans font-medium">
              {savingQuote ? "Guardando…" : "Guardar cotización"}
            </Button>
          </div>
        </div>
      )}

      {/* Tab: Contrato */}
      {activeTab === "contrato" && (
        <div className="space-y-5">
          {!contract ? (
            <div className="rounded-lg border border-dashed border-border p-10 text-center space-y-4">
              <ClipboardList size={28} className="mx-auto text-muted-foreground" />
              <div>
                <p className="font-heading font-semibold">Sin contrato</p>
                <p className="text-sm font-sans text-muted-foreground mt-1">
                  {quote
                    ? "Genera el contrato desde la cotización actual."
                    : "Primero guarda una cotización."}
                </p>
              </div>
              <Button
                onClick={handleGenerateContract}
                disabled={!quote || savingContract}
                className="bg-gold hover:bg-gold-dark text-ink font-sans font-medium"
              >
                {savingContract ? "Generando…" : "Generar contrato"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Contract status */}
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className={`font-sans text-xs ${contract.status === "firmado" ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}`}>
                    {contract.status === "firmado" ? "Firmado" : "Borrador"}
                  </Badge>
                  {contract.signed_at && (
                    <span className="text-xs font-sans text-muted-foreground">
                      Firmado el {formatDate(contract.signed_at.slice(0, 10))}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {contract.status !== "firmado" && (
                    <Button size="sm" className="font-sans text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={signContract} disabled={savingContract}>
                      <Check size={13} className="mr-1" /> Marcar como firmado
                    </Button>
                  )}
                  <a
                    href={`/api/pdf/contract/${contract.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 h-7 rounded-md border border-border bg-background px-2.5 text-xs font-sans text-foreground hover:bg-muted hover:border-gold/40 transition-colors"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    PDF
                  </a>
                  <EmailButton
                    action="contract"
                    id={contract.id}
                    label="Enviar al cliente"
                  />
                </div>
              </div>

              {/* Clauses editor */}
              <div className="space-y-3">
                {contractClauses.map((clause, index) => (
                  <div key={clause.id} className="rounded-lg border border-border p-4 space-y-2">
                    <Input
                      value={clause.title}
                      onChange={(e) => setContractClauses((prev) => prev.map((c, i) => i === index ? { ...c, title: e.target.value } : c))}
                      className="font-heading font-semibold border-transparent bg-transparent px-0 text-base focus:bg-background focus:border-border focus:px-2"
                    />
                    <Textarea
                      value={clause.content}
                      onChange={(e) => setContractClauses((prev) => prev.map((c, i) => i === index ? { ...c, content: e.target.value } : c))}
                      className="font-sans text-sm resize-none border-transparent bg-transparent px-0 focus:bg-background focus:border-border focus:px-2"
                      rows={3}
                    />
                  </div>
                ))}
                <Button
                  type="button" variant="outline" size="sm" className="font-sans"
                  onClick={() => setContractClauses((prev) => [...prev, {
                    id: String(Date.now()),
                    title: "Nueva cláusula",
                    content: "",
                  }])}
                >
                  <Plus size={13} className="mr-1" /> Agregar cláusula
                </Button>
              </div>

              <div className="flex justify-end">
                <Button onClick={saveContract} disabled={savingContract} className="bg-gold hover:bg-gold-dark text-ink font-sans font-medium">
                  {savingContract ? "Guardando…" : "Guardar contrato"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Pagos */}
      {activeTab === "pagos" && (() => {
        const totalScheduled = payments.reduce((s, p) => s + p.amount, 0)
        const totalPaid = payments.filter((p) => p.status === "pagado").reduce((s, p) => s + (p.paid_amount ?? p.amount), 0)
        const quoteTotal = quote?.total ?? 0

        return (
          <div className="space-y-5">
            {/* Summary */}
            {payments.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Total cotización", value: formatCurrency(quoteTotal), className: "" },
                  { label: "Programado", value: formatCurrency(totalScheduled), className: "" },
                  { label: "Cobrado", value: formatCurrency(totalPaid), className: "text-emerald-700" },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg border border-border p-3 space-y-0.5">
                    <p className="text-xs font-sans text-muted-foreground">{s.label}</p>
                    <p className={`text-lg font-heading font-bold tabular-nums ${s.className}`}>{s.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Milestone list */}
            {payments.length === 0 ? (
              <div className="rounded-md border border-dashed border-border p-10 text-center space-y-3">
                <p className="font-heading font-semibold">Sin hitos de pago</p>
                <p className="text-sm font-sans text-muted-foreground">Define el anticipo, pagos parciales y liquidación.</p>
                <Button onClick={openNewMilestone} className="bg-gold hover:bg-gold-dark text-ink font-sans font-medium">
                  <Plus size={14} className="mr-1" /> Agregar hito
                </Button>
              </div>
            ) : (
              <div className="rounded-md border border-border overflow-hidden">
                {payments.map((p, i) => {
                  const status = computePaymentStatus(p)
                  const statusCfg = {
                    pagado:   { label: "Pagado",   className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
                    vencido:  { label: "Vencido",  className: "bg-red-100 text-red-800 border-red-200" },
                    pendiente:{ label: "Pendiente", className: "bg-muted text-muted-foreground border-transparent" },
                  }[status] ?? { label: status, className: "" }

                  return (
                    <div key={p.id} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-border" : ""}`}>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{p.description}</p>
                        <p className="text-xs font-sans text-muted-foreground">
                          Vence: {formatDate(p.due_date)}
                          {p.paid_at ? ` · Cobrado: ${formatDate(p.paid_at)}` : ""}
                          {p.reference ? ` · Ref: ${p.reference}` : ""}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-medium tabular-nums text-sm">{formatCurrency(p.amount)}</p>
                        {p.paid_amount && p.paid_amount !== p.amount && (
                          <p className="text-xs font-sans text-muted-foreground tabular-nums">Pagado: {formatCurrency(p.paid_amount)}</p>
                        )}
                      </div>
                      <Badge variant="secondary" className={`font-sans text-xs border shrink-0 ${statusCfg.className}`}>
                        {statusCfg.label}
                      </Badge>
                      <div className="flex gap-1 shrink-0">
                        {status !== "pagado" ? (
                          <Button size="sm" variant="outline" className="font-sans text-xs h-7 px-2"
                            onClick={() => { setMarkPaidOpen(p); setPaidForm({ paid_at: new Date().toISOString().slice(0, 10), paid_amount: String(p.amount), reference: "" }) }}>
                            <Check size={12} className="mr-1" /> Cobrar
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" className="font-sans text-xs h-7 px-2 text-muted-foreground"
                            onClick={() => handleUnmarkPaid(p)}>
                            Revertir
                          </Button>
                        )}
                        <a
                          href={googleCalendarEventUrl({
                            title: `${p.description} — ${event.name}`,
                            startDate: p.due_date,
                            details: `Monto: ${formatCurrency(p.amount)}${p.notes ? `\n${p.notes}` : ""}`,
                          })}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Agregar recordatorio a Google Calendar"
                        >
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-gold">
                            <Calendar size={12} />
                          </Button>
                        </a>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditMilestone(p)}>
                          <Pencil size={12} />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteMilestone(p)}>
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {payments.length > 0 && (
              <Button variant="outline" size="sm" className="font-sans" onClick={openNewMilestone}>
                <Plus size={14} className="mr-1" /> Agregar hito
              </Button>
            )}
          </div>
        )
      })()}

      {/* Tab: Requisición */}
      {activeTab === "requisicion" && (
        <div className="space-y-5">
          {!requisition ? (
            <div className="rounded-lg border border-dashed border-border p-10 text-center space-y-4">
              <Package size={28} className="mx-auto text-muted-foreground" />
              <div>
                <p className="font-heading font-semibold">Sin requisición</p>
                <p className="text-sm font-sans text-muted-foreground mt-1">
                  {quote
                    ? "Genera la explosión de recetas a partir de los platillos de la cotización."
                    : "Primero crea una cotización con platillos."}
                </p>
              </div>
              {quote && (
                <Button
                  onClick={handleGenerateRequisition}
                  disabled={generatingReq}
                  className="bg-gold hover:bg-gold-dark text-ink font-sans font-medium"
                >
                  {generatingReq ? "Generando…" : "Generar requisición"}
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {/* Requisition status bar */}
              <div className="flex items-center justify-between flex-wrap gap-3 rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  {(["generada", "revisada", "aprobada"] as const).map((s, i, arr) => {
                    const isCurrent = s === requisition.status
                    const statusKeys = arr as string[]
                    const currentIdx = statusKeys.indexOf(requisition.status)
                    const isPast = i < currentIdx
                    const labels: Record<string, string> = { generada: "Generada", revisada: "Revisada", aprobada: "Aprobada" }
                    const colors: Record<string, string> = {
                      generada: "bg-blue-100 text-blue-800 border-blue-200",
                      revisada: "bg-amber-100 text-amber-800 border-amber-200",
                      aprobada: "bg-emerald-100 text-emerald-800 border-emerald-200",
                    }
                    return (
                      <div key={s} className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleRequisitionStatus(s)}
                          className={`px-3 py-1 rounded-full text-xs font-sans font-medium transition-colors border ${
                            isCurrent ? `${colors[s]} cursor-default` :
                            isPast ? "bg-muted text-muted-foreground border-transparent" :
                            "text-muted-foreground border-transparent hover:bg-muted"
                          }`}
                        >
                          {labels[s]}
                        </button>
                        {i < arr.length - 1 && <ChevronRight size={12} className="text-muted-foreground" />}
                      </div>
                    )
                  })}
                </div>
                <div className="flex gap-2">
                  {purchaseOrders.length === 0 && (
                    <Button
                      size="sm"
                      onClick={handleGeneratePOs}
                      disabled={generatingPOs}
                      className="bg-gold hover:bg-gold-dark text-ink font-sans font-medium text-xs"
                    >
                      <ShoppingCart size={13} className="mr-1" />
                      {generatingPOs ? "Generando…" : "Generar órdenes de compra"}
                    </Button>
                  )}
                  <Button
                    size="sm" variant="ghost"
                    className="font-sans text-xs text-destructive hover:text-destructive"
                    onClick={handleDeleteRequisition}
                  >
                    Eliminar requisición
                  </Button>
                </div>
              </div>

              {/* Requisition items table */}
              {requisition.requisition_items.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading text-sm font-semibold">Ingredientes</h3>
                    <p className="text-sm font-sans text-muted-foreground">
                      Total estimado:{" "}
                      <span className="font-semibold text-foreground tabular-nums">
                        {formatCurrency(requisition.requisition_items.reduce((s, i) => s + i.total_cost, 0))}
                      </span>
                    </p>
                  </div>
                  <div className="rounded-md border border-border overflow-hidden">
                    <div className="grid grid-cols-[1fr_80px_80px_100px] gap-2 px-3 py-2 bg-muted/40 text-xs font-sans font-semibold uppercase tracking-wider text-muted-foreground">
                      <span>Ingrediente</span>
                      <span className="text-right">Cantidad</span>
                      <span className="text-right">Precio unit.</span>
                      <span className="text-right">Total</span>
                    </div>
                    {requisition.requisition_items.map((item) => (
                      <div key={item.id} className="grid grid-cols-[1fr_80px_80px_100px] gap-2 px-3 py-2.5 border-t border-border items-center">
                        <span className="font-medium text-sm truncate">
                          {item.ingredients?.name ?? item.ingredient_id}
                        </span>
                        <span className="text-sm font-sans tabular-nums text-right text-muted-foreground">
                          {item.quantity.toFixed(3)} {item.unit}
                        </span>
                        <span className="text-sm font-sans tabular-nums text-right text-muted-foreground">
                          {formatCurrency(item.unit_cost)}
                        </span>
                        <span className="text-sm font-sans tabular-nums text-right font-medium">
                          {formatCurrency(item.total_cost)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-md border border-dashed border-border p-6 text-center">
                  <p className="text-sm font-sans text-muted-foreground">Sin ítems en la requisición</p>
                </div>
              )}

              {/* Purchase Orders */}
              {purchaseOrders.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-heading text-sm font-semibold">Órdenes de compra</h3>
                  <div className="rounded-md border border-border overflow-hidden">
                    {purchaseOrders.map((po, i) => {
                      const poStatusCfg: Record<string, string> = {
                        pendiente: "bg-muted text-muted-foreground border-transparent",
                        enviada:   "bg-blue-100 text-blue-800 border-blue-200",
                        recibida:  "bg-emerald-100 text-emerald-800 border-emerald-200",
                      }
                      const poStatusLabel: Record<string, string> = {
                        pendiente: "Pendiente", enviada: "Enviada", recibida: "Recibida",
                      }
                      const isExpanded = expandedPO === po.id
                      return (
                        <div key={po.id} className={i > 0 ? "border-t border-border" : ""}>
                          <div
                            className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
                            onClick={() => setExpandedPO(isExpanded ? null : po.id)}
                          >
                            <ChevronRight size={14} className={`text-muted-foreground transition-transform shrink-0 ${isExpanded ? "rotate-90" : ""}`} />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{po.suppliers?.name ?? "Sin proveedor asignado"}</p>
                              <p className="text-xs font-sans text-muted-foreground">
                                {po.purchase_order_items.length} ingrediente{po.purchase_order_items.length !== 1 ? "s" : ""}
                                {po.buy_by_date ? ` · Comprar antes del ${formatShortDate(po.buy_by_date)}` : ""}
                                {po.received_at ? ` · Recibido ${formatShortDate(po.received_at)}` : ""}
                              </p>
                            </div>
                            <span className="font-medium tabular-nums text-sm shrink-0">{formatCurrency(po.subtotal)}</span>
                            <Badge variant="secondary" className={`font-sans text-xs border shrink-0 ${poStatusCfg[po.status] ?? ""}`}>
                              {poStatusLabel[po.status] ?? po.status}
                            </Badge>
                            <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                              {po.status === "pendiente" && (
                                <Button size="sm" variant="outline" className="font-sans text-xs h-7 px-2"
                                  onClick={() => handlePOStatus(po, "enviada")}>
                                  Marcar enviada
                                </Button>
                              )}
                              {po.status === "enviada" && (
                                <Button size="sm" className="font-sans text-xs h-7 px-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                                  onClick={() => handlePOStatus(po, "recibida")}>
                                  <Check size={12} className="mr-1" /> Recibida
                                </Button>
                              )}
                            </div>
                          </div>
                          {isExpanded && po.purchase_order_items.length > 0 && (
                            <div className="border-t border-border bg-muted/20 px-8 py-3">
                              <div className="space-y-1">
                                {po.purchase_order_items.map((item) => (
                                  <div key={item.id} className="grid grid-cols-[1fr_80px_80px_100px] gap-2 text-sm font-sans">
                                    <span className="text-foreground">{item.ingredients?.name ?? "—"}</span>
                                    <span className="tabular-nums text-right text-muted-foreground">{item.quantity.toFixed(3)} {item.unit}</span>
                                    <span className="tabular-nums text-right text-muted-foreground">{formatCurrency(item.unit_cost)}</span>
                                    <span className="tabular-nums text-right font-medium">{formatCurrency(item.total_cost)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab: Compras */}
      {activeTab === "compras" && (
        <ComprasTab
          eventId={event.id}
          guestCount={event.guest_count}
          quoteTotal={quote?.total ?? 0}
          requisitionItems={(requisition?.requisition_items ?? []) as Parameters<typeof ComprasTab>[0]["requisitionItems"]}
          initialActualPurchases={actualPurchases}
          initialIndirectCosts={indirectCosts}
          indirectCostCategories={indirectCostCategories}
          staffCost={staffAssignments.reduce((s, a) => s + a.computed_cost, 0)}
        />
      )}

      {/* Tab: Personal */}
      {activeTab === "personal" && (
        <PersonalTab
          eventId={event.id}
          eventDate={event.event_date}
          initialAssignments={staffAssignments as Parameters<typeof PersonalTab>[0]["initialAssignments"]}
          staffMembers={staffMembers as Parameters<typeof PersonalTab>[0]["staffMembers"]}
        />
      )}

      {/* Add/edit milestone dialog */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">{editingMilestone ? "Editar hito" : "Nuevo hito de pago"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="font-sans">Descripción *</Label>
              <Input value={payForm.description} onChange={(e) => setPayForm((f) => ({ ...f, description: e.target.value }))} placeholder="Ej. Anticipo 50%" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-sans">Monto (MXN) *</Label>
                <Input type="number" step="0.01" min="0" value={payForm.amount} onChange={(e) => setPayForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-sans">Fecha límite *</Label>
                <Input type="date" value={payForm.due_date} onChange={(e) => setPayForm((f) => ({ ...f, due_date: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="font-sans">Notas</Label>
              <Input value={payForm.notes} onChange={(e) => setPayForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Método de pago, condiciones, etc." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)} className="font-sans">Cancelar</Button>
            <Button onClick={saveMilestone} disabled={savingPayment} className="bg-gold hover:bg-gold-dark text-ink font-sans font-medium">
              {savingPayment ? "Guardando…" : editingMilestone ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as paid dialog */}
      <Dialog open={!!markPaidOpen} onOpenChange={() => setMarkPaidOpen(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Registrar pago</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm font-sans text-muted-foreground">{markPaidOpen?.description}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-sans">Fecha de pago *</Label>
                <Input type="date" value={paidForm.paid_at} onChange={(e) => setPaidForm((f) => ({ ...f, paid_at: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="font-sans">Monto recibido</Label>
                <Input type="number" step="0.01" min="0" value={paidForm.paid_amount} onChange={(e) => setPaidForm((f) => ({ ...f, paid_amount: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="font-sans">Referencia / comprobante</Label>
              <Input value={paidForm.reference} onChange={(e) => setPaidForm((f) => ({ ...f, reference: e.target.value }))} placeholder="Folio, transferencia, etc." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkPaidOpen(null)} className="font-sans">Cancelar</Button>
            <Button onClick={handleMarkPaid} disabled={savingPayment} className="bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-medium">
              {savingPayment ? "Guardando…" : "Confirmar pago"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit event dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Editar evento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="font-sans">Nombre *</Label>
              <Input {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label className="font-sans">Cliente</Label>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant={clientMode === "existing" ? "default" : "outline"} className="font-sans text-xs" onClick={() => setClientMode("existing")}>Existente</Button>
                <Button type="button" size="sm" variant={clientMode === "new" ? "default" : "outline"} className="font-sans text-xs" onClick={() => setClientMode("new")}>Nuevo</Button>
              </div>
              {clientMode === "existing" ? (
                <Select value={watchClientId} onValueChange={(v) => setValue("client_id", v ?? "")}>
                  <SelectTrigger className="font-sans"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="" className="font-sans">Sin cliente</SelectItem>
                    {clients.map((c) => <SelectItem key={c.id} value={c.id} className="font-sans">{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input {...register("new_client_name")} placeholder="Nombre del nuevo cliente" />
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-sans">Tipo</Label>
                <Select value={watchEventType} onValueChange={(v) => setValue("event_type", v ?? "")}>
                  <SelectTrigger className="font-sans"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((t) => <SelectItem key={t} value={t} className="font-sans">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="font-sans">Invitados *</Label>
                <Input {...register("guest_count", { valueAsNumber: true })} type="number" min="1" />
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
              <Input {...register("location")} />
            </div>
            <div className="space-y-1.5">
              <Label className="font-sans">Notas</Label>
              <Textarea {...register("notes")} rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)} className="font-sans">Cancelar</Button>
              <Button type="submit" disabled={loading} className="bg-gold hover:bg-gold-dark text-ink font-sans font-medium">
                {loading ? "Guardando…" : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-heading">Eliminar evento</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground font-sans">
            ¿Eliminar <strong>{event.name}</strong>? Se eliminarán también la cotización y contrato asociados.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} className="font-sans">Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading} className="font-sans">
              {loading ? "Eliminando…" : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
