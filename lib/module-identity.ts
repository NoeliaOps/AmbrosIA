import {
  LayoutDashboard, Calendar, CalendarDays, FileText, FileSignature,
  CreditCard, ClipboardList, ShoppingCart, BarChart2, TrendingUp,
  Users, Package, UtensilsCrossed, BookOpen, Truck, DollarSign,
  LayoutTemplate, MessageSquare, Warehouse, type LucideIcon,
} from "lucide-react"

// Identidad por módulo: cada función tiene su acento, ícono y categoría.
// Los acentos son tonos editoriales apagados (no primarios) para no romper
// la armonía de "Pizarra & Champagne"; todos pasan contraste como texto/icono
// sobre blanco y se usan también en versión tenue (color-mix) para fondos.
export type ModuleIdentity = {
  accent: string   // color de acento (hex, apto para texto/ícono sobre blanco)
  icon: LucideIcon // ícono representativo de la función
  kicker: string   // categoría corta (agrupa módulos por área)
}

// Ordenado de ruta más específica a más general (se evalúa con startsWith).
const REGISTRY: { match: string; id: ModuleIdentity }[] = [
  // ── Recetas (núcleo operativo) ──
  { match: "/catalogos/ingredientes",     id: { accent: "#5F6B2F", icon: Package,          kicker: "Recetas"   } }, // olivo
  { match: "/catalogos/platillos",        id: { accent: "#8B6D24", icon: UtensilsCrossed,  kicker: "Recetas"   } }, // brass
  { match: "/catalogos/menus",            id: { accent: "#6B4C6B", icon: BookOpen,         kicker: "Recetas"   } }, // ciruela
  // ── Catálogos complementarios ──
  { match: "/catalogos/proveedores",      id: { accent: "#3D5A80", icon: Truck,            kicker: "Catálogo"  } }, // azul pizarra
  { match: "/catalogos/personal",         id: { accent: "#4A5568", icon: Users,            kicker: "Catálogo"  } }, // acero
  { match: "/catalogos/costos-indirectos",id: { accent: "#6B4A2F", icon: DollarSign,       kicker: "Catálogo"  } }, // cacao
  // ── Comercial ──
  { match: "/cotizaciones",               id: { accent: "#4C4F8A", icon: FileText,         kicker: "Comercial" } }, // índigo
  { match: "/contratos",                  id: { accent: "#6B4C6B", icon: FileSignature,    kicker: "Comercial" } }, // ciruela
  // ── Finanzas ──
  { match: "/pagos",                      id: { accent: "#2F6B4F", icon: CreditCard,       kicker: "Finanzas"  } }, // bosque
  { match: "/utilidad",                   id: { accent: "#1F6E55", icon: TrendingUp,       kicker: "Finanzas"  } }, // esmeralda
  // ── Abasto ──
  { match: "/requisiciones",              id: { accent: "#2C6E6A", icon: ClipboardList,    kicker: "Abasto"    } }, // teal
  { match: "/ordenes-compra",             id: { accent: "#9A5B3F", icon: ShoppingCart,     kicker: "Abasto"    } }, // arcilla
  { match: "/compras-reales",             id: { accent: "#8A3F4D", icon: BarChart2,        kicker: "Abasto"    } }, // vino
  { match: "/inventario",                 id: { accent: "#6B4A2F", icon: Warehouse,        kicker: "Almacén"   } }, // cacao
  // ── Operación ──
  { match: "/calendario",                 id: { accent: "#3D5A80", icon: Calendar,         kicker: "Agenda"    } }, // azul pizarra
  { match: "/eventos",                    id: { accent: "#8B6D24", icon: CalendarDays,     kicker: "Operación" } }, // brass (firma)
  { match: "/personal-eventos",           id: { accent: "#4A5568", icon: Users,            kicker: "Operación" } }, // acero
  { match: "/postmortem",                 id: { accent: "#3C3C3C", icon: MessageSquare,    kicker: "Operación" } }, // carbón
  { match: "/plantillas",                 id: { accent: "#4C4F8A", icon: LayoutTemplate,   kicker: "Catálogo"  } }, // índigo
  // ── Resumen ──
  { match: "/",                           id: { accent: "#3C3C3C", icon: LayoutDashboard,  kicker: "Resumen"   } }, // carbón (fallback)
]

export function getModuleIdentity(pathname: string): ModuleIdentity {
  for (const { match, id } of REGISTRY) {
    if (match === "/" ? pathname === "/" : pathname.startsWith(match)) return id
  }
  return REGISTRY[REGISTRY.length - 1].id // dashboard / carbón
}

// Fondo tenue derivado del acento (para crest, líneas, chips).
export function accentSoft(accent: string, pct = 10) {
  return `color-mix(in srgb, ${accent} ${pct}%, white)`
}
