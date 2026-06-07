import { DEMO_PERSONAS, type DemoPersona } from "@/lib/demo"
import type { ModuleKey } from "@/lib/modules" // import de tipo (sin runtime/iconos)

// Mapeo ruta → módulo que la protege. Sin iconos para ser seguro en el edge.
const MODULE_PATHS: { prefix: string; key: ModuleKey }[] = [
  { prefix: "/eventos", key: "events" },
  { prefix: "/cotizaciones", key: "quotes" },
  { prefix: "/contratos", key: "contracts" },
  { prefix: "/pagos", key: "payments" },
  { prefix: "/requisiciones", key: "requisitions" },
  { prefix: "/ordenes-compra", key: "purchase_orders" },
  { prefix: "/compras-reales", key: "actual_purchases" },
  { prefix: "/utilidad", key: "profit" },
  { prefix: "/personal-eventos", key: "staff" },
  { prefix: "/calendario", key: "calendar" },
  { prefix: "/plantillas", key: "templates" },
  { prefix: "/postmortem", key: "postmortem" },
  { prefix: "/inventario", key: "inventory" },
]

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(prefix + "/")
}

// ¿Puede la persona acceder a esta ruta? (control de acceso por rol)
export function canAccessPath(persona: DemoPersona, pathname: string): boolean {
  const p = DEMO_PERSONAS[persona]

  // Dashboard (home) — todos los roles
  if (pathname === "/") return true

  // Configuración — solo quien tenga showSettings
  if (matchesPrefix(pathname, "/configuracion")) return p.showSettings

  // Catálogos — según showCatalogs y catalogPaths
  if (matchesPrefix(pathname, "/catalogos")) {
    if (!p.showCatalogs) return false
    if (!p.catalogPaths) return true
    return p.catalogPaths.some((cp) => matchesPrefix(pathname, cp))
  }

  // Módulos con ruta propia
  const match = MODULE_PATHS.find((m) => matchesPrefix(pathname, m.prefix))
  if (match) return p.allowedModules.includes(match.key)

  // Rutas no mapeadas (API, etc.) — no se bloquean aquí
  return true
}
