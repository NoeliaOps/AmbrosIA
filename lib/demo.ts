import type { ModuleKey } from "@/lib/modules"

export type DemoPersona = "ceo" | "gerente" | "ventas" | "compras" | "chef"

export const DEMO_COOKIE = "artesano_demo_persona"

export type PersonaConfig = {
  key: DemoPersona
  name: string
  title: string
  initials: string
  color: string
  allowedModules: ModuleKey[]
  showCatalogs: boolean
  catalogPaths?: string[]   // si se define, limita a estas rutas de catálogo
  showSettings: boolean
}

// Todos los módulos (para CEO/Gerente)
const ALL_MODULES: ModuleKey[] = [
  "dashboard", "calendar", "events", "quotes", "contracts", "templates", "payments",
  "requisitions", "purchase_orders", "actual_purchases", "inventory", "profit", "staff",
  "postmortem",
]

export const DEMO_PERSONAS: Record<DemoPersona, PersonaConfig> = {
  // ── Dirección — visión total del negocio + configuración ──
  ceo: {
    key: "ceo",
    name: "Roberto García",
    title: "Dirección General · CEO",
    initials: "RG",
    color: "bg-gold text-ink",
    allowedModules: ALL_MODULES,
    showCatalogs: true,
    showSettings: true,
  },
  // ── Gerencia — coordina todo el ciclo operativo (sin configuración) ──
  gerente: {
    key: "gerente",
    name: "Carmen Ruiz",
    title: "Gerente General",
    initials: "CR",
    color: "bg-[#3D5A80] text-white",
    allowedModules: ALL_MODULES,
    showCatalogs: true,
    showSettings: false,
  },
  // ── Ventas — embudo comercial: cotizar, contratar, cobrar ──
  ventas: {
    key: "ventas",
    name: "Sofía Méndez",
    title: "Ventas",
    initials: "SM",
    color: "bg-[#4C4F8A] text-white",
    allowedModules: ["dashboard", "calendar", "events", "quotes", "contracts", "payments", "templates", "postmortem"],
    showCatalogs: true,
    catalogPaths: ["/catalogos/platillos", "/catalogos/menus"],
    showSettings: false,
  },
  // ── Compras — abasto: requisiciones, órdenes, compras, inventario ──
  compras: {
    key: "compras",
    name: "Miguel Torres",
    title: "Compras",
    initials: "MT",
    color: "bg-[#9A5B3F] text-white",
    allowedModules: ["dashboard", "calendar", "events", "requisitions", "purchase_orders", "actual_purchases", "inventory"],
    showCatalogs: true,
    catalogPaths: ["/catalogos/ingredientes", "/catalogos/proveedores"],
    showSettings: false,
  },
  // ── Chef — producción: recetas, platillos, menús y lo que pide la cocina ──
  chef: {
    key: "chef",
    name: "Lucía Fernández",
    title: "Chef Ejecutiva",
    initials: "LF",
    color: "bg-[#2F6B4F] text-white",
    allowedModules: ["dashboard", "calendar", "events", "requisitions"],
    showCatalogs: true,
    catalogPaths: ["/catalogos/ingredientes", "/catalogos/platillos", "/catalogos/menus"],
    showSettings: false,
  },
}

export const PERSONA_ORDER: DemoPersona[] = ["ceo", "gerente", "ventas", "compras", "chef"]

export function getPersona(raw: string | undefined): DemoPersona {
  if (raw === "ceo" || raw === "gerente" || raw === "ventas" || raw === "compras" || raw === "chef") return raw
  return "ceo"
}
