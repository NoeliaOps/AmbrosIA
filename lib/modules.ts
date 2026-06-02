import {
  LayoutDashboard,
  CalendarDays,
  FileText,
  FileSignature,
  CreditCard,
  ClipboardList,
  ShoppingCart,
  BarChart2,
  TrendingUp,
  Users,
  Package,
  UtensilsCrossed,
  BookOpen,
  Truck,
  DollarSign,
  Calendar,
  LayoutTemplate,
  MessageSquare,
  Warehouse,
  type LucideIcon,
} from "lucide-react"

export type ModuleKey =
  | "dashboard"
  | "events"
  | "quotes"
  | "contracts"
  | "payments"
  | "requisitions"
  | "purchase_orders"
  | "actual_purchases"
  | "profit"
  | "staff"
  | "calendar"
  | "templates"
  | "postmortem"
  | "inventory"

type ModuleConfig = {
  label: string
  description: string
  path: string
  icon: LucideIcon
  group: "core" | "optional"
  defaultEnabled: boolean
}

export const MODULE_REGISTRY: Record<ModuleKey, ModuleConfig> = {
  dashboard: {
    label: "Dashboard",
    description: "Indicadores clave y resumen ejecutivo",
    path: "/",
    icon: LayoutDashboard,
    group: "core",
    defaultEnabled: true,
  },
  events: {
    label: "Eventos",
    description: "Gestión del ciclo de vida de cada evento",
    path: "/eventos",
    icon: CalendarDays,
    group: "core",
    defaultEnabled: true,
  },
  quotes: {
    label: "Cotizaciones",
    description: "Generación y seguimiento de cotizaciones",
    path: "/cotizaciones",
    icon: FileText,
    group: "core",
    defaultEnabled: true,
  },
  contracts: {
    label: "Contratos",
    description: "Contratos generados a partir de cotizaciones aprobadas",
    path: "/contratos",
    icon: FileSignature,
    group: "core",
    defaultEnabled: true,
  },
  payments: {
    label: "Pagos",
    description: "Calendario de pagos y seguimiento de cobros",
    path: "/pagos",
    icon: CreditCard,
    group: "core",
    defaultEnabled: true,
  },
  requisitions: {
    label: "Requisiciones",
    description: "Explosión de recetas y requisición de insumos",
    path: "/requisiciones",
    icon: ClipboardList,
    group: "core",
    defaultEnabled: true,
  },
  purchase_orders: {
    label: "Órdenes de Compra",
    description: "Órdenes por proveedor y calendario de compras",
    path: "/ordenes-compra",
    icon: ShoppingCart,
    group: "core",
    defaultEnabled: true,
  },
  actual_purchases: {
    label: "Compras Reales",
    description: "Registro de compras reales vs. estimado",
    path: "/compras-reales",
    icon: BarChart2,
    group: "core",
    defaultEnabled: true,
  },
  profit: {
    label: "Utilidad Real",
    description: "Estado de resultados por evento",
    path: "/utilidad",
    icon: TrendingUp,
    group: "core",
    defaultEnabled: true,
  },
  staff: {
    label: "Personal",
    description: "Asignación y control de personal por evento",
    path: "/personal-eventos",
    icon: Users,
    group: "core",
    defaultEnabled: true,
  },
  calendar: {
    label: "Calendario",
    description: "Vista de disponibilidad de fechas",
    path: "/calendario",
    icon: Calendar,
    group: "optional",
    defaultEnabled: false,
  },
  templates: {
    label: "Plantillas",
    description: "Menús y paquetes reutilizables",
    path: "/plantillas",
    icon: LayoutTemplate,
    group: "optional",
    defaultEnabled: false,
  },
  postmortem: {
    label: "Post-mortem",
    description: "Notas y lecciones aprendidas por evento",
    path: "/postmortem",
    icon: MessageSquare,
    group: "optional",
    defaultEnabled: false,
  },
  inventory: {
    label: "Inventario",
    description: "Control básico de almacén",
    path: "/inventario",
    icon: Warehouse,
    group: "optional",
    defaultEnabled: false,
  },
}

export const CATALOG_NAV = [
  { label: "Ingredientes",       path: "/catalogos/ingredientes",      icon: Package },
  { label: "Platillos",          path: "/catalogos/platillos",          icon: UtensilsCrossed },
  { label: "Menús",              path: "/catalogos/menus",              icon: BookOpen },
  { label: "Proveedores",        path: "/catalogos/proveedores",        icon: Truck },
  { label: "Personal",           path: "/catalogos/personal",           icon: Users },
  { label: "Costos Indirectos",  path: "/catalogos/costos-indirectos",  icon: DollarSign },
] as const

export const SETTINGS_NAV = [
  { label: "Módulos", path: "/configuracion" },
] as const
