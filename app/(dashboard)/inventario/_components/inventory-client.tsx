"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, AlertTriangle, Warehouse as WarehouseIcon, ArrowLeftRight, Sliders, ArrowDownToLine, ArrowUpFromLine, Settings2, Star, Snowflake } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { formatCurrency } from "@/lib/utils"
import {
  createWarehouse, updateWarehouse, deleteWarehouse, setDefaultWarehouse,
  addStockItem, removeStockItem, adjustStock, stockEntry, stockExit, transferStock,
} from "../actions"

const ACCENT = "#6B4A2F"
const COLD = "#3D5A80" // azul pizarra para almacenes fríos
const LOW = "#991B1B"
const GREEN = "#166534"

export const WAREHOUSE_TYPES = [
  { value: "ambiente", label: "Ambiente", cold: false },
  { value: "refrigerado", label: "Refrigerado", cold: true },
  { value: "congelado", label: "Congelado", cold: true },
] as const
function typeMeta(t: string) { return WAREHOUSE_TYPES.find((x) => x.value === t) ?? WAREHOUSE_TYPES[0] }

export type Warehouse = { id: string; name: string; location: string | null; type: string; is_default: boolean; is_active: boolean }
export type StockRow = { id: string; warehouse_id: string; ingredient_id: string; quantity: number; min_quantity: number; ingredients: { name: string; unit: string; category: string | null; current_price: number } | null }
export type IngredientOption = { id: string; name: string; unit: string; current_price: number }
export type MovementRow = { id: string; warehouse_id: string; ingredient_id: string; type: string; quantity: number; unit_cost: number | null; reference: string | null; created_at: string; ingredients: { name: string; unit: string } | null }

const MOVE_LABEL: Record<string, string> = { entrada: "Entrada", salida: "Salida", ajuste: "Ajuste", traspaso_entrada: "Traspaso (entra)", traspaso_salida: "Traspaso (sale)" }
const fmtQty = (n: number) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 1000) / 1000))
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })

export function InventoryClient({ warehouses, stock, ingredients, movements }: { warehouses: Warehouse[]; stock: StockRow[]; ingredients: IngredientOption[]; movements: MovementRow[] }) {
  const router = useRouter()
  const [whId, setWhId] = useState(warehouses.find((w) => w.is_default)?.id ?? warehouses[0]?.id ?? "")
  const [view, setView] = useState<"existencias" | "kardex">("existencias")
  const [busy, setBusy] = useState(false)

  // dialogs
  const [whManager, setWhManager] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [moveKind, setMoveKind] = useState<null | "entrada" | "salida">(null)
  const [adjustRow, setAdjustRow] = useState<StockRow | null>(null)
  const [transferRow, setTransferRow] = useState<StockRow | null>(null)

  // form state
  const [addIng, setAddIng] = useState(""); const [addMin, setAddMin] = useState("0")
  const [moveIng, setMoveIng] = useState(""); const [moveQty, setMoveQty] = useState(""); const [moveCost, setMoveCost] = useState(""); const [moveRef, setMoveRef] = useState("")
  const [adjustQty, setAdjustQty] = useState("")
  const [transferTo, setTransferTo] = useState(""); const [transferQty, setTransferQty] = useState("")

  const wh = warehouses.find((w) => w.id === whId)
  const selCold = typeMeta(wh?.type ?? "ambiente").cold
  const whAccent = selCold ? COLD : ACCENT
  const whStock = useMemo(() => stock.filter((s) => s.warehouse_id === whId).sort((a, b) => (a.ingredients?.name ?? "").localeCompare(b.ingredients?.name ?? "")), [stock, whId])
  const whMovements = useMemo(() => movements.filter((m) => m.warehouse_id === whId), [movements, whId])
  const trackedIds = new Set(whStock.map((s) => s.ingredient_id))
  const available = ingredients.filter((i) => !trackedIds.has(i.id))

  const isLow = (s: StockRow) => s.quantity <= s.min_quantity
  const lowItems = whStock.filter(isLow)
  const totalValue = whStock.reduce((t, s) => t + s.quantity * (s.ingredients?.current_price ?? 0), 0)

  async function run(fn: () => Promise<{ error: string | null } | { data: unknown; error: string | null }>) {
    setBusy(true)
    const res = await fn()
    setBusy(false)
    if (res?.error) { toast.error(res.error); return false }
    router.refresh()
    return true
  }

  async function doAdd() {
    if (!addIng) { toast.error("Selecciona un insumo"); return }
    if (await run(() => addStockItem(whId, addIng, parseFloat(addMin) || 0))) { toast.success("Insumo agregado al almacén"); setAddOpen(false); setAddIng(""); setAddMin("0") }
  }
  async function doMove() {
    if (!moveIng) { toast.error("Selecciona un insumo"); return }
    const qty = parseFloat(moveQty)
    const fn = moveKind === "entrada"
      ? () => stockEntry(whId, moveIng, qty, moveCost ? parseFloat(moveCost) : null, moveRef || undefined)
      : () => stockExit(whId, moveIng, qty, moveRef || undefined)
    if (await run(fn)) { toast.success(moveKind === "entrada" ? "Entrada registrada" : "Salida registrada"); setMoveKind(null); setMoveIng(""); setMoveQty(""); setMoveCost(""); setMoveRef("") }
  }
  async function doAdjust() {
    if (!adjustRow) return
    if (await run(() => adjustStock(whId, adjustRow.ingredient_id, parseFloat(adjustQty) || 0))) { toast.success("Existencia ajustada"); setAdjustRow(null) }
  }
  async function doTransfer() {
    if (!transferRow || !transferTo) { toast.error("Selecciona el almacén destino"); return }
    if (await run(() => transferStock(whId, transferTo, transferRow.ingredient_id, parseFloat(transferQty) || 0))) { toast.success("Traspaso realizado"); setTransferRow(null); setTransferTo(""); setTransferQty("") }
  }

  if (warehouses.length === 0) {
    return <div className="enterprise-card p-10 text-center"><p className="text-sm font-sans text-muted-foreground">No hay almacenes.</p></div>
  }

  return (
    <div className="space-y-5">
      {/* Selector de almacén */}
      <div className="flex items-center gap-2 flex-wrap">
        {warehouses.map((w) => {
          const active = w.id === whId
          const cold = typeMeta(w.type).cold
          const a = cold ? COLD : ACCENT
          const Icon = cold ? Snowflake : WarehouseIcon
          return (
            <button key={w.id} onClick={() => setWhId(w.id)}
              className="px-3 py-1.5 rounded-full text-xs font-sans font-medium border transition-colors flex items-center gap-1.5"
              style={active
                ? { background: a, color: "#fff", borderColor: a }
                : { background: "var(--card)", color: "var(--text-2)", borderColor: cold ? `color-mix(in srgb, ${COLD} 35%, white)` : "var(--border-def, #EBEBEC)" }}>
              <Icon size={12} style={!active && cold ? { color: COLD } : undefined} /> {w.name}
              {w.is_default && <Star size={10} style={{ fill: active ? "#fff" : a, color: active ? "#fff" : a }} />}
            </button>
          )
        })}
        <Button size="sm" variant="outline" className="h-7 text-xs font-sans gap-1" onClick={() => setWhManager(true)}>
          <Settings2 size={13} /> Almacenes
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="enterprise-card p-3.5" style={{ borderLeft: `3px solid ${whAccent}` }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)" }}>Valor del inventario</p>
          <p className="mono-data" style={{ fontSize: "1.35rem", fontWeight: 700, color: whAccent, lineHeight: 1.15 }}>{formatCurrency(totalValue)}</p>
          <p className="flex items-center gap-1" style={{ fontFamily: "var(--font-sans)", fontSize: "0.68rem", color: "var(--text-3)" }}>
            {selCold && <Snowflake size={10} style={{ color: COLD }} />}
            {typeMeta(wh?.type ?? "ambiente").label}{wh?.location ? ` · ${wh.location}` : ""}
          </p>
        </div>
        <div className="enterprise-card p-3.5">
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)" }}>Insumos</p>
          <p className="mono-data" style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-1)", lineHeight: 1.15 }}>{whStock.length}</p>
        </div>
        <div className="enterprise-card p-3.5" style={lowItems.length > 0 ? { borderLeft: `3px solid ${LOW}` } : undefined}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)" }}>Bajo mínimo</p>
          <p className="mono-data" style={{ fontSize: "1.35rem", fontWeight: 700, color: lowItems.length > 0 ? LOW : "var(--text-1)", lineHeight: 1.15 }}>{lowItems.length}</p>
        </div>
      </div>

      {lowItems.length > 0 && (
        <div className="rounded-lg border px-4 py-3 flex items-start gap-3" style={{ borderColor: `color-mix(in srgb, ${LOW} 30%, white)`, background: `color-mix(in srgb, ${LOW} 4%, white)` }}>
          <AlertTriangle size={16} className="shrink-0 mt-0.5" style={{ color: LOW }} />
          <div>
            <p className="text-sm font-sans font-semibold" style={{ color: "var(--text-1)" }}>{lowItems.length} insumo{lowItems.length !== 1 ? "s" : ""} en o por debajo del mínimo</p>
            <p className="text-xs font-sans" style={{ color: "var(--text-2)" }}>{lowItems.map((i) => i.ingredients?.name).filter(Boolean).slice(0, 8).join(" · ")}</p>
          </div>
        </div>
      )}

      {/* Tabs + acciones */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 p-1 rounded-lg w-fit" style={{ background: "var(--surface-2, #F4F4F5)" }}>
          {([["existencias", "Existencias"], ["kardex", "Movimientos"]] as const).map(([k, label]) => (
            <button key={k} onClick={() => setView(k)} className="px-3.5 py-1.5 rounded-md text-xs font-sans font-medium transition-colors"
              style={view === k ? { background: "var(--card, #fff)", color: "var(--text-1)", boxShadow: "0 1px 2px rgb(0 0 0 / 0.06)" } : { color: "var(--text-3)" }}>{label}</button>
          ))}
        </div>
        {view === "existencias" && (
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" variant="outline" className="h-8 text-xs font-sans gap-1" onClick={() => { setMoveKind("entrada"); setMoveIng(""); setMoveQty(""); setMoveCost(""); setMoveRef("") }}><ArrowDownToLine size={13} /> Entrada</Button>
            <Button size="sm" variant="outline" className="h-8 text-xs font-sans gap-1" onClick={() => { setMoveKind("salida"); setMoveIng(""); setMoveQty(""); setMoveRef("") }}><ArrowUpFromLine size={13} /> Salida</Button>
            <Button size="sm" className="h-8 text-xs bg-[#2D2926] hover:bg-[#1A1714] text-white font-sans gap-1" onClick={() => { setAddOpen(true); setAddIng(""); setAddMin("0") }} disabled={available.length === 0}><Plus size={13} /> Agregar insumo</Button>
          </div>
        )}
      </div>

      {/* Existencias */}
      {view === "existencias" && (
        whStock.length === 0 ? (
          <EmptyState icon={WarehouseIcon} title="Almacén vacío"
            description="Agrega insumos a este almacén o recibe una orden de compra para generar existencias."
            action={available.length > 0 ? { label: "Agregar insumo", onClick: () => setAddOpen(true) } : undefined} />
        ) : (
          <div className="enterprise-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-sans min-w-[680px]">
                <thead>
                  <tr style={{ fontSize: "0.6rem" }} className="font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
                    <th className="px-4 py-2 text-left">Insumo</th>
                    <th className="px-3 py-2 text-right">Existencia</th>
                    <th className="px-3 py-2 text-right">Mínimo</th>
                    <th className="px-3 py-2 text-right">Valor</th>
                    <th className="px-3 py-2 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {whStock.map((s) => {
                    const low = isLow(s)
                    const value = s.quantity * (s.ingredients?.current_price ?? 0)
                    return (
                      <tr key={s.id} className="border-t border-border table-row-hover" style={low ? { background: `color-mix(in srgb, ${LOW} 4%, white)` } : undefined}>
                        <td className="px-4 py-2.5">
                          <p style={{ fontWeight: 500, color: "var(--text-1)" }}>{s.ingredients?.name ?? "—"}</p>
                          {s.ingredients?.category && <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.ingredients.category}</p>}
                        </td>
                        <td className="px-3 py-2.5 text-right mono-data" style={{ fontWeight: 600, color: low ? LOW : "var(--text-1)" }}>
                          {fmtQty(s.quantity)} <span style={{ color: "var(--text-3)", fontWeight: 400 }}>{s.ingredients?.unit}</span>
                          {low && <AlertTriangle size={11} style={{ color: LOW, display: "inline", marginLeft: 4 }} />}
                        </td>
                        <td className="px-3 py-2.5 text-right mono-data" style={{ color: "var(--text-3)" }}>{fmtQty(s.min_quantity)}</td>
                        <td className="px-3 py-2.5 text-right mono-data" style={{ color: "var(--text-2)" }}>{formatCurrency(value)}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" title="Ajustar existencia" onClick={() => { setAdjustRow(s); setAdjustQty(String(s.quantity)) }}><Sliders size={13} /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" title="Traspasar" disabled={warehouses.length < 2} onClick={() => { setTransferRow(s); setTransferTo(""); setTransferQty("") }}><ArrowLeftRight size={13} /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" title="Quitar del almacén" onClick={() => run(() => removeStockItem(s.id))}><Trash2 size={13} /></Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Kardex */}
      {view === "kardex" && (
        whMovements.length === 0 ? (
          <div className="enterprise-card py-12 text-center"><p className="text-sm font-sans text-muted-foreground">Sin movimientos en este almacén.</p></div>
        ) : (
          <div className="enterprise-card overflow-hidden divide-y divide-border">
            {whMovements.map((m) => {
              const isIn = m.quantity >= 0
              return (
                <div key={m.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-3)", width: "5.5rem" }} className="shrink-0">{fmtDate(m.created_at)}</span>
                  <span className="shrink-0" style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: isIn ? GREEN : LOW, width: "6.5rem" }}>{MOVE_LABEL[m.type] ?? m.type}</span>
                  <span className="flex-1 min-w-0 truncate font-sans text-sm" style={{ color: "var(--text-1)" }}>{m.ingredients?.name ?? "—"}<span className="text-muted-foreground text-xs">{m.reference ? ` · ${m.reference}` : ""}</span></span>
                  <span className="shrink-0 mono-data text-right" style={{ fontWeight: 700, color: isIn ? GREEN : LOW, width: "6rem" }}>{isIn ? "+" : ""}{fmtQty(m.quantity)} <span style={{ color: "var(--text-3)", fontWeight: 400 }}>{m.ingredients?.unit}</span></span>
                </div>
              )
            })}
          </div>
        )
      )}

      {/* ── Diálogo: agregar insumo ── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-heading">Agregar insumo a {wh?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label className="font-sans text-sm">Insumo</Label>
              <Select value={addIng} onValueChange={(v) => setAddIng(v ?? "")}>
                <SelectTrigger className="font-sans"><SelectValue placeholder="Selecciona…" /></SelectTrigger>
                <SelectContent>{available.map((i) => <SelectItem key={i.id} value={i.id} className="font-sans">{i.name} <span className="text-muted-foreground">({i.unit})</span></SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-sans text-sm">Mínimo</Label>
              <Input type="number" step="0.001" min="0" value={addMin} onChange={(e) => setAddMin(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="font-sans">Cancelar</Button>
            <Button onClick={doAdd} disabled={busy || !addIng} className="bg-[#2D2926] hover:bg-[#1A1714] text-white font-sans font-medium">Agregar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Diálogo: entrada / salida ── */}
      <Dialog open={!!moveKind} onOpenChange={(o) => !o && setMoveKind(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-heading">{moveKind === "entrada" ? "Registrar entrada" : "Registrar salida"} — {wh?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label className="font-sans text-sm">Insumo</Label>
              <Select value={moveIng} onValueChange={(v) => setMoveIng(v ?? "")}>
                <SelectTrigger className="font-sans"><SelectValue placeholder="Selecciona…" /></SelectTrigger>
                <SelectContent>{ingredients.map((i) => <SelectItem key={i.id} value={i.id} className="font-sans">{i.name} <span className="text-muted-foreground">({i.unit})</span></SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-sans text-sm">Cantidad (unidad base)</Label>
                <Input type="number" step="0.001" min="0" value={moveQty} onChange={(e) => setMoveQty(e.target.value)} />
              </div>
              {moveKind === "entrada" && (
                <div className="space-y-1.5">
                  <Label className="font-sans text-sm">Costo unitario (opc.)</Label>
                  <Input type="number" step="0.01" min="0" value={moveCost} onChange={(e) => setMoveCost(e.target.value)} placeholder="actual" />
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="font-sans text-sm">Referencia / nota</Label>
              <Input value={moveRef} onChange={(e) => setMoveRef(e.target.value)} placeholder="Compra directa, merma, etc." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveKind(null)} className="font-sans">Cancelar</Button>
            <Button onClick={doMove} disabled={busy || !moveIng} className="bg-[#2D2926] hover:bg-[#1A1714] text-white font-sans font-medium">Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Diálogo: ajustar ── */}
      <Dialog open={!!adjustRow} onOpenChange={(o) => !o && setAdjustRow(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-heading">Ajustar existencia</DialogTitle></DialogHeader>
          <p className="text-sm font-sans text-muted-foreground -mt-1">{adjustRow?.ingredients?.name} · actual {fmtQty(adjustRow?.quantity ?? 0)} {adjustRow?.ingredients?.unit}</p>
          <div className="space-y-1.5 py-1">
            <Label className="font-sans text-sm">Nueva existencia ({adjustRow?.ingredients?.unit})</Label>
            <Input type="number" step="0.001" min="0" value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} />
            <p className="text-[11px] font-sans text-muted-foreground">Se registrará un movimiento de ajuste por la diferencia.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustRow(null)} className="font-sans">Cancelar</Button>
            <Button onClick={doAdjust} disabled={busy} className="bg-[#2D2926] hover:bg-[#1A1714] text-white font-sans font-medium">Ajustar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Diálogo: traspaso ── */}
      <Dialog open={!!transferRow} onOpenChange={(o) => !o && setTransferRow(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-heading">Traspasar entre almacenes</DialogTitle></DialogHeader>
          <p className="text-sm font-sans text-muted-foreground -mt-1">{transferRow?.ingredients?.name} · disponible {fmtQty(transferRow?.quantity ?? 0)} {transferRow?.ingredients?.unit} en {wh?.name}</p>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label className="font-sans text-sm">Almacén destino</Label>
              <Select value={transferTo} onValueChange={(v) => setTransferTo(v ?? "")}>
                <SelectTrigger className="font-sans"><SelectValue placeholder="Selecciona…" /></SelectTrigger>
                <SelectContent>{warehouses.filter((w) => w.id !== whId).map((w) => <SelectItem key={w.id} value={w.id} className="font-sans">{w.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-sans text-sm">Cantidad ({transferRow?.ingredients?.unit})</Label>
              <Input type="number" step="0.001" min="0" value={transferQty} onChange={(e) => setTransferQty(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferRow(null)} className="font-sans">Cancelar</Button>
            <Button onClick={doTransfer} disabled={busy || !transferTo} className="bg-[#2D2926] hover:bg-[#1A1714] text-white font-sans font-medium">Traspasar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Diálogo: gestor de almacenes ── */}
      <WarehouseManager open={whManager} onOpenChange={setWhManager} warehouses={warehouses} onChanged={() => router.refresh()} />
    </div>
  )
}

function WarehouseManager({ open, onOpenChange, warehouses, onChanged }: { open: boolean; onOpenChange: (o: boolean) => void; warehouses: Warehouse[]; onChanged: () => void }) {
  const [name, setName] = useState(""); const [location, setLocation] = useState(""); const [type, setType] = useState("ambiente")
  const [editing, setEditing] = useState<Warehouse | null>(null)
  const [busy, setBusy] = useState(false)

  function resetForm() { setName(""); setLocation(""); setType("ambiente"); setEditing(null) }

  async function wrap(fn: () => Promise<{ error: string | null } | { data: unknown; error: string | null }>) {
    setBusy(true); const res = await fn(); setBusy(false)
    if (res?.error) { toast.error(res.error); return false }
    onChanged(); return true
  }
  async function save() {
    if (!name.trim()) { toast.error("Nombre requerido"); return }
    const ok = editing
      ? await wrap(() => updateWarehouse(editing.id, { name, location, type, is_default: editing.is_default, is_active: editing.is_active }))
      : await wrap(() => createWarehouse({ name, location, type }))
    if (ok) { toast.success(editing ? "Almacén actualizado" : "Almacén creado"); resetForm() }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="font-heading">Almacenes</DialogTitle></DialogHeader>
        <div className="rounded-md border border-border divide-y divide-border">
          {warehouses.map((w) => (
            <div key={w.id} className="flex items-center gap-2 px-3 py-2">
              <button title={w.is_default ? "Predeterminado" : "Hacer predeterminado"} onClick={() => !w.is_default && wrap(() => setDefaultWarehouse(w.id)).then((ok) => ok && toast.success("Predeterminado actualizado"))}>
                <Star size={14} style={{ color: w.is_default ? ACCENT : "var(--text-3)", fill: w.is_default ? ACCENT : "transparent" }} />
              </button>
              <div className="flex-1 min-w-0">
                <p className="font-sans text-sm font-medium truncate" style={{ color: "var(--text-1)" }}>{w.name}</p>
                {w.location && <p className="text-xs font-sans text-muted-foreground truncate">{w.location}</p>}
              </div>
              {(() => { const m = typeMeta(w.type); return (
                <span className="flex items-center gap-1 shrink-0" style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: m.cold ? COLD : "var(--text-3)" }}>
                  {m.cold && <Snowflake size={10} />}{m.label}
                </span>
              ) })()}
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(w); setName(w.name); setLocation(w.location ?? ""); setType(w.type) }}><Pencil size={13} /></Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" disabled={w.is_default || warehouses.length < 2} onClick={() => wrap(() => deleteWarehouse(w.id)).then((ok) => ok && toast.success("Almacén eliminado"))}><Trash2 size={13} /></Button>
            </div>
          ))}
        </div>
        <div className="space-y-2 pt-1">
          <p className="font-sans text-xs font-semibold text-muted-foreground uppercase tracking-wider">{editing ? "Editar almacén" : "Nuevo almacén"}</p>
          <div className="grid grid-cols-2 gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre (Bodega, Cocina…)" className="font-sans h-9" />
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ubicación (opc.)" className="font-sans h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="font-sans text-xs">Tipo de almacén</Label>
            <Select value={type} onValueChange={(v) => setType(v ?? "ambiente")}>
              <SelectTrigger className="font-sans h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {WAREHOUSE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="font-sans">{t.cold ? "❄ " : ""}{t.label}{t.cold ? " (frío)" : " (no frío)"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            {editing && <Button size="sm" variant="outline" onClick={resetForm} className="font-sans">Cancelar edición</Button>}
            <Button size="sm" onClick={save} disabled={busy} className="bg-[#2D2926] hover:bg-[#1A1714] text-white font-sans"><Plus size={13} className="mr-1" />{editing ? "Guardar" : "Crear almacén"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
