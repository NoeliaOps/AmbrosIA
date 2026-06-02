import type { ModuleKey } from "@/lib/modules"

export type DemoPersona = "admin" | "coordinadora" | "chef"

export const DEMO_COOKIE = "artesano_demo_persona"

export type PersonaConfig = {
  key: DemoPersona
  name: string
  title: string
  initials: string
  color: string
  allowedModules: ModuleKey[]
  showCatalogs: boolean
  catalogPaths?: string[]
  showSettings: boolean
}

export const DEMO_PERSONAS: Record<DemoPersona, PersonaConfig> = {
  admin: {
    key: "admin",
    name: "Roberto García",
    title: "Gerente General",
    initials: "RG",
    color: "bg-gold text-ink",
    allowedModules: [
      "dashboard", "events", "quotes", "contracts", "payments",
      "requisitions", "purchase_orders", "actual_purchases", "profit", "staff",
    ],
    showCatalogs: true,
    showSettings: true,
  },
  coordinadora: {
    key: "coordinadora",
    name: "Carmen Ruiz",
    title: "Coordinadora de Eventos",
    initials: "CR",
    color: "bg-blue-500 text-white",
    allowedModules: ["dashboard", "events", "quotes", "contracts", "payments", "staff"],
    showCatalogs: false,
    showSettings: false,
  },
  chef: {
    key: "chef",
    name: "Miguel Torres",
    title: "Chef / Jefe de Compras",
    initials: "MT",
    color: "bg-orange-500 text-white",
    allowedModules: ["dashboard", "events", "requisitions", "purchase_orders", "actual_purchases"],
    showCatalogs: true,
    catalogPaths: ["/catalogos/ingredientes", "/catalogos/platillos", "/catalogos/menus", "/catalogos/proveedores"],
    showSettings: false,
  },
}

export function getPersona(raw: string | undefined): DemoPersona {
  if (raw === "coordinadora" || raw === "chef") return raw
  return "admin"
}
