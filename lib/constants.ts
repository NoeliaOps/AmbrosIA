export const APP_NAME = "AmbrosIA"
export const APP_DESCRIPTION = "Sistema de gestión interna"

export const DEFAULT_ORG_NAME = "Mi Organización"
export const DEFAULT_ORG_SLUG = "org"

export const EVENT_STATUSES = {
  cotizado:       { label: "Cotizado",       color: "bg-blue-100 text-blue-800" },
  contratado:     { label: "Contratado",     color: "bg-purple-100 text-purple-800" },
  en_requisicion: { label: "En Requisición", color: "bg-amber-100 text-amber-800" },
  en_compras:     { label: "En Compras",     color: "bg-orange-100 text-orange-800" },
  completado:     { label: "Completado",     color: "bg-green-100 text-green-800" },
  cancelado:      { label: "Cancelado",      color: "bg-red-100 text-red-800" },
} as const

export const QUOTE_STATUSES = {
  borrador: { label: "Borrador",  color: "bg-gray-100 text-gray-700" },
  enviada:  { label: "Enviada",   color: "bg-blue-100 text-blue-800" },
  aprobada: { label: "Aprobada",  color: "bg-green-100 text-green-800" },
  rechazada:{ label: "Rechazada", color: "bg-red-100 text-red-800" },
} as const

export const PAYMENT_STATUSES = {
  pendiente: { label: "Pendiente", color: "bg-amber-100 text-amber-800" },
  pagado:    { label: "Pagado",    color: "bg-green-100 text-green-800" },
  vencido:   { label: "Vencido",   color: "bg-red-100 text-red-800" },
} as const

export const REQUISITION_STATUSES = {
  generada: { label: "Generada", color: "bg-blue-100 text-blue-800" },
  revisada: { label: "Revisada", color: "bg-amber-100 text-amber-800" },
  aprobada: { label: "Aprobada", color: "bg-green-100 text-green-800" },
} as const

export const PO_STATUSES = {
  pendiente: { label: "Pendiente", color: "bg-amber-100 text-amber-800" },
  enviada:   { label: "Enviada",   color: "bg-blue-100 text-blue-800" },
  recibida:  { label: "Recibida",  color: "bg-green-100 text-green-800" },
} as const

export const USER_ROLES = {
  admin:       { label: "Administrador" },
  coordinator: { label: "Coordinador de Eventos" },
  chef:        { label: "Chef / Compras" },
} as const

export const EVENT_TYPES = [
  "Boda",
  "XV Años",
  "Bautizo",
  "Graduación",
  "Evento corporativo",
  "Evento social",
  "Otro",
] as const

// Taxonomía única de categorías de insumos/proveedores (mismo dominio: tipo de producto).
// Usada tanto por el catálogo de ingredientes como por el de proveedores.
export const FOOD_CATEGORIES = [
  "Carnes y aves",
  "Pescados y mariscos",
  "Frutas y verduras",
  "Lácteos y huevos",
  "Abarrotes y secos",
  "Especias y condimentos",
  "Panadería y repostería",
  "Bebidas",
  "Vinos y licores",
  "Otros",
] as const

export const INGREDIENT_CATEGORIES = FOOD_CATEGORIES
export const SUPPLIER_CATEGORIES = FOOD_CATEGORIES

export const DISH_CATEGORIES = [
  "Entrada",
  "Sopa",
  "Ensalada",
  "Plato principal",
  "Guarnición",
  "Postre",
  "Bebida",
  "Botana",
] as const

export const UNITS_OF_MEASURE = [
  "kg", "g", "lb", "oz",
  "l", "ml",
  "pza", "caja", "bolsa", "lata",
  "manojo", "cabeza", "diente", "cono", "costal",
  "taza", "cucharada", "cucharadita",
] as const

export const STAFF_POSITIONS = [
  "Capitán",
  "Mesero",
  "Bartender",
  "Chef ejecutivo",
  "Sous chef",
  "Cocinero",
  "Repostero",
  "Ayudante de cocina",
  "Coordinador",
  "Logística",
  "Limpieza",
] as const

export const INDIRECT_COST_ALLOCATION = [
  { value: "fixed",       label: "Monto fijo por evento" },
  { value: "per_guest",   label: "Por comensal" },
  { value: "percentage",  label: "% sobre ingresos" },
] as const
