/**
 * Demo seed for Artesano Banquetes
 * Run: npm run db:seed
 *
 * Requirements: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */
import { createClient } from "@supabase/supabase-js"
import * as fs from "fs"
import * as path from "path"

// ── load env ──────────────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(__dirname, "../.env.local")
  if (!fs.existsSync(envPath)) {
    console.error("❌  .env.local not found")
    process.exit(1)
  }
  const lines = fs.readFileSync(envPath, "utf8").split("\n")
  for (const line of lines) {
    const [key, ...val] = line.split("=")
    if (key && val.length) process.env[key.trim()] = val.join("=").trim()
  }
}
loadEnv()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// ── stable demo UUIDs ─────────────────────────────────────────────────────────
const IDS = {
  org:   "aaaaaaaa-aaaa-aaaa-aaaa-000000000001",
  user:  "bbbbbbbb-bbbb-bbbb-bbbb-000000000001",

  // suppliers
  sup: {
    carnes:    "cc000001-0000-0000-0000-000000000001",
    verduras:  "cc000002-0000-0000-0000-000000000001",
    lacteos:   "cc000003-0000-0000-0000-000000000001",
    abarrotes: "cc000004-0000-0000-0000-000000000001",
    mariscos:  "cc000005-0000-0000-0000-000000000001",
    vinos:     "cc000006-0000-0000-0000-000000000001",
    especias:  "cc000007-0000-0000-0000-000000000001",
    panaderia: "cc000008-0000-0000-0000-000000000001",
  },

  // ingredients
  ing: {
    pollo:        "dd000001-0000-0000-0000-000000000001",
    filete:       "dd000002-0000-0000-0000-000000000001",
    arrachera:    "dd000003-0000-0000-0000-000000000001",
    lomo_cerdo:   "dd000004-0000-0000-0000-000000000001",
    camaron:      "dd000005-0000-0000-0000-000000000001",
    jitomate:     "dd000006-0000-0000-0000-000000000001",
    cebolla:      "dd000007-0000-0000-0000-000000000001",
    ajo:          "dd000008-0000-0000-0000-000000000001",
    chile_poblano:"dd000009-0000-0000-0000-000000000001",
    tomate_verde: "dd000010-0000-0000-0000-000000000001",
    champiñones:  "dd000011-0000-0000-0000-000000000001",
    aguacate:     "dd000012-0000-0000-0000-000000000001",
    limon:        "dd000013-0000-0000-0000-000000000001",
    crema:        "dd000014-0000-0000-0000-000000000001",
    queso_fresco: "dd000015-0000-0000-0000-000000000001",
    mantequilla:  "dd000016-0000-0000-0000-000000000001",
    aceite_oliva: "dd000017-0000-0000-0000-000000000001",
    arroz:        "dd000018-0000-0000-0000-000000000001",
    frijol:       "dd000019-0000-0000-0000-000000000001",
    harina:       "dd000020-0000-0000-0000-000000000001",
    azucar:       "dd000021-0000-0000-0000-000000000001",
    huevo:        "dd000022-0000-0000-0000-000000000001",
    leche:        "dd000023-0000-0000-0000-000000000001",
    cilantro:     "dd000024-0000-0000-0000-000000000001",
    perejil:      "dd000025-0000-0000-0000-000000000001",
    comino:       "dd000026-0000-0000-0000-000000000001",
    chile_ancho:  "dd000027-0000-0000-0000-000000000001",
    lechuga:      "dd000028-0000-0000-0000-000000000001",
    pan_baguette: "dd000029-0000-0000-0000-000000000001",
    vino_blanco:  "dd000030-0000-0000-0000-000000000001",
    cajeta:       "dd000031-0000-0000-0000-000000000001",
    chocolate:    "dd000032-0000-0000-0000-000000000001",
    crema_batir:  "dd000033-0000-0000-0000-000000000001",
    zanahoria:    "dd000034-0000-0000-0000-000000000001",
    brocoli:      "dd000035-0000-0000-0000-000000000001",
  },

  // dishes
  dish: {
    crema_poblano:     "ee000001-0000-0000-0000-000000000001",
    ensalada_cesar:    "ee000002-0000-0000-0000-000000000001",
    pollo_salsa_verde: "ee000003-0000-0000-0000-000000000001",
    mole_pollo:        "ee000004-0000-0000-0000-000000000001",
    pollo_crema:       "ee000005-0000-0000-0000-000000000001",
    filete_vino:       "ee000006-0000-0000-0000-000000000001",
    arrachera:         "ee000007-0000-0000-0000-000000000001",
    lomo_ciruela:      "ee000008-0000-0000-0000-000000000001",
    camaron_ajo:       "ee000009-0000-0000-0000-000000000001",
    arroz_rojo:        "ee000010-0000-0000-0000-000000000001",
    frijoles_olla:     "ee000011-0000-0000-0000-000000000001",
    verduras_vapor:    "ee000012-0000-0000-0000-000000000001",
    flan_cajeta:       "ee000013-0000-0000-0000-000000000001",
    tres_leches:       "ee000014-0000-0000-0000-000000000001",
    mousse_chocolate:  "ee000015-0000-0000-0000-000000000001",
    guacamole:         "ee000016-0000-0000-0000-000000000001",
    caldo_res:         "ee000017-0000-0000-0000-000000000001",
    carnitas:          "ee000018-0000-0000-0000-000000000001",
    ceviche_camaron:   "ee000019-0000-0000-0000-000000000001",
    pan_ajo:           "ee000020-0000-0000-0000-000000000001",
  },

  // staff
  staff: {
    roberto:   "ff000001-0000-0000-0000-000000000001",
    ana:       "ff000002-0000-0000-0000-000000000001",
    miguel:    "ff000003-0000-0000-0000-000000000001",
    carmen:    "ff000004-0000-0000-0000-000000000001",
    luis:      "ff000005-0000-0000-0000-000000000001",
    sofia:     "ff000006-0000-0000-0000-000000000001",
    carlos:    "ff000007-0000-0000-0000-000000000001",
    patricia:  "ff000008-0000-0000-0000-000000000001",
    jose:      "ff000009-0000-0000-0000-000000000001",
    diana:     "ff000010-0000-0000-0000-000000000001",
    fernando:  "ff000011-0000-0000-0000-000000000001",
    isabel:    "ff000012-0000-0000-0000-000000000001",
  },

  // clients
  client: {
    garcia:   "gg000001-0000-0000-0000-000000000001",
    morales:  "gg000002-0000-0000-0000-000000000001",
    grupo:    "gg000003-0000-0000-0000-000000000001",
    lopez:    "gg000004-0000-0000-0000-000000000001",
    perez:    "gg000005-0000-0000-0000-000000000001",
    cemex:    "gg000006-0000-0000-0000-000000000001",
  },

  // indirect cost categories
  icat: {
    renta_equipo: "hh000001-0000-0000-0000-000000000001",
    logistica:    "hh000002-0000-0000-0000-000000000001",
    decoracion:   "hh000003-0000-0000-0000-000000000001",
    cristaleria:  "hh000004-0000-0000-0000-000000000001",
    gas_cocina:   "hh000005-0000-0000-0000-000000000001",
  },

  // events
  ev: {
    boda_garcia:   "ii000001-0000-0000-0000-000000000001",
    xv_valentina:  "ii000002-0000-0000-0000-000000000001",
    corp_grupo:    "ii000003-0000-0000-0000-000000000001",
    boda_lopez:    "ii000004-0000-0000-0000-000000000001",
    grad_perez:    "ii000005-0000-0000-0000-000000000001",
    cena_cemex:    "ii000006-0000-0000-0000-000000000001",
  },
}

// ── helpers ───────────────────────────────────────────────────────────────────
function ok(label: string, error: { message: string } | null) {
  if (error) { console.error(`  ❌  ${label}: ${error.message}`); return false }
  console.log(`  ✅  ${label}`)
  return true
}

async function clearDemoData() {
  console.log("\n🗑  Clearing existing demo data…")
  // Delete in dependency order (children first)
  const tables = [
    "event_staff_assignments",
    "event_indirect_costs",
    "actual_purchases",
    "purchase_order_items",
    "purchase_orders",
    "requisition_items",
    "requisitions",
    "payment_schedules",
    "contracts",
    "quote_line_items",
    "quotes",
    "events",
    "clients",
    "staff_members",
    "indirect_cost_categories",
    "menu_dishes",
    "menus",
    "recipe_items",
    "dishes",
    "ingredient_price_history",
    "ingredients",
    "suppliers",
    "module_settings",
  ]
  for (const t of tables) {
    const { error } = await supabase.from(t as "suppliers").delete().eq("org_id", IDS.org)
    if (error && !error.message.includes("column") && !error.message.includes("does not exist")) {
      // some tables don't have org_id — delete by event_id or skip
    }
  }
  // Tables without org_id — delete by relationship
  for (const t of ["event_indirect_costs", "actual_purchases", "purchase_order_items", "purchase_orders", "requisition_items", "requisitions", "payment_schedules", "contracts", "quote_line_items", "quotes", "event_staff_assignments"]) {
    await supabase.from(t as "quotes").delete().in("event_id", Object.values(IDS.ev))
  }
}

// ── main ──────────────────────────────────────────────────────────────────────
async function seed() {
  console.log("🌱  Starting Artesano Banquetes demo seed…\n")

  // ── org ────────────────────────────────────────────────────────────────────
  console.log("🏢  Organization")
  const { error: orgErr } = await supabase
    .from("organizations")
    .upsert({ id: IDS.org, name: "Artesano Banquetes", slug: "artesano-banquetes" }, { onConflict: "id" })
  ok("Organización", orgErr)

  // ── auth user ──────────────────────────────────────────────────────────────
  console.log("\n👤  Demo user")
  const { data: existingUser } = await supabase.auth.admin.getUserById(IDS.user)
  if (!existingUser.user) {
    const { error: userErr } = await supabase.auth.admin.createUser({
      email: "admin@artesano.mx",
      password: "ArtesanoDemo2024!",
      email_confirm: true,
      user_metadata: { full_name: "Administrador Demo" },
    } as Parameters<typeof supabase.auth.admin.createUser>[0])
    ok("Usuario admin@artesano.mx", userErr)
  } else {
    console.log("  ✅  Usuario ya existe")
  }

  const { data: uuidResult } = await supabase.auth.admin.listUsers()
  const adminUser = uuidResult?.users.find((u) => u.email === "admin@artesano.mx")
  const userId = adminUser?.id ?? IDS.user

  const { error: profileErr } = await supabase
    .from("profiles")
    .upsert({
      id: userId,
      org_id: IDS.org,
      email: "admin@artesano.mx",
      full_name: "Roberto Artesano",
      role: "admin",
    }, { onConflict: "id" })
  ok("Perfil admin", profileErr)

  // ── module settings ────────────────────────────────────────────────────────
  console.log("\n⚙️  Module settings")
  const modules = ["quotes", "contracts", "payments", "requisitions", "purchase_orders", "actual_purchases", "profit", "staff", "dashboard"]
  for (const m of modules) {
    const { error } = await supabase.from("module_settings").upsert({
      org_id: IDS.org, module_key: m, is_enabled: true
    }, { onConflict: "org_id,module_key" })
    if (error) console.error(`    Module ${m}: ${error.message}`)
  }
  console.log("  ✅  Módulos habilitados")

  await clearDemoData()

  // ── suppliers ──────────────────────────────────────────────────────────────
  console.log("\n🏪  Suppliers")
  const { error: supErr } = await supabase.from("suppliers").insert([
    { id: IDS.sup.carnes,    org_id: IDS.org, name: "La Central Carnes",        contact_name: "Ramón Gutiérrez", phone: "442-234-5678", email: "ventas@lacentralcarnes.mx",     category: "Carnes y aves",       notes: "Proveedor principal de carnes frescas y maduradas" },
    { id: IDS.sup.verduras,  org_id: IDS.org, name: "Verduras del Campo",        contact_name: "Elena Sandoval",  phone: "442-345-6789", email: "elena@verdurasdecampo.com",     category: "Frutas y verduras",        notes: "Entrega lunes, miércoles y viernes" },
    { id: IDS.sup.lacteos,   org_id: IDS.org, name: "Lácteos Querétaro",         contact_name: "Jorge Medina",    phone: "442-456-7890", email: "jorgemedina@lacteosqro.mx",     category: "Lácteos y huevos",         notes: "Productos artesanales de la región" },
    { id: IDS.sup.abarrotes, org_id: IDS.org, name: "Distribuidora Omega",       contact_name: "Petra Villegas",  phone: "442-567-8901", email: "petra@distribuidoraomega.com",   category: "Abarrotes y secos",        notes: "Mayorista, pedidos mínimo $2,000" },
    { id: IDS.sup.mariscos,  org_id: IDS.org, name: "Mariscos Frescos del Mar",  contact_name: "Felipe Olvera",   phone: "442-678-9012", email: "felipeolvera@mariscosfrescos.mx",category: "Pescados y mariscos",      notes: "Pedido con 48 hrs anticipación" },
    { id: IDS.sup.vinos,     org_id: IDS.org, name: "Bodegas Terrón",            contact_name: "Lucía Terrón",    phone: "442-789-0123", email: "lucia@bodegasterron.mx",         category: "Vinos y licores",          notes: "Distribuidora oficial de varias marcas" },
    { id: IDS.sup.especias,  org_id: IDS.org, name: "Especias del Mundo",        contact_name: "Carlos Ríos",     phone: "442-890-1234", email: "carlosrios@especiasdelmundo.com", category: "Especias y condimentos",  notes: "Importador directo" },
    { id: IDS.sup.panaderia, org_id: IDS.org, name: "Panadería San Miguel",      contact_name: "María de Luna",   phone: "442-901-2345", email: "mariadluna@panaderiasanmiguel.mx", category: "Panadería y repostería",      notes: "Pedidos con 3 días de anticipación" },
  ])
  ok("8 proveedores", supErr)

  // ── ingredients ────────────────────────────────────────────────────────────
  console.log("\n🥩  Ingredients")
  const { error: ingErr } = await supabase.from("ingredients").insert([
    // Carnes
    { id: IDS.ing.pollo,         org_id: IDS.org, name: "Pechuga de pollo",         unit: "kg",    category: "Carnes y aves",     current_price: 92.00,  preferred_supplier_id: IDS.sup.carnes },
    { id: IDS.ing.filete,        org_id: IDS.org, name: "Filete de res",             unit: "kg",    category: "Carnes y aves",     current_price: 315.00, preferred_supplier_id: IDS.sup.carnes },
    { id: IDS.ing.arrachera,     org_id: IDS.org, name: "Arrachera marinada",        unit: "kg",    category: "Carnes y aves",     current_price: 262.00, preferred_supplier_id: IDS.sup.carnes },
    { id: IDS.ing.lomo_cerdo,    org_id: IDS.org, name: "Lomo de cerdo",             unit: "kg",    category: "Carnes y aves",     current_price: 158.00, preferred_supplier_id: IDS.sup.carnes },
    { id: IDS.ing.camaron,       org_id: IDS.org, name: "Camarón U/15 limpio",       unit: "kg",    category: "Pescados y mariscos",   current_price: 379.00, preferred_supplier_id: IDS.sup.mariscos },
    // Verduras
    { id: IDS.ing.jitomate,      org_id: IDS.org, name: "Jitomate guaje",            unit: "kg",    category: "Frutas y verduras",   current_price: 32.00,  preferred_supplier_id: IDS.sup.verduras },
    { id: IDS.ing.cebolla,       org_id: IDS.org, name: "Cebolla blanca",            unit: "kg",    category: "Frutas y verduras",   current_price: 22.00,  preferred_supplier_id: IDS.sup.verduras },
    { id: IDS.ing.ajo,           org_id: IDS.org, name: "Ajo pelado",                unit: "kg",    category: "Frutas y verduras",   current_price: 95.00,  preferred_supplier_id: IDS.sup.verduras },
    { id: IDS.ing.chile_poblano, org_id: IDS.org, name: "Chile poblano",             unit: "kg",    category: "Frutas y verduras",   current_price: 52.00,  preferred_supplier_id: IDS.sup.verduras },
    { id: IDS.ing.tomate_verde,  org_id: IDS.org, name: "Tomate verde (tomatillo)",  unit: "kg",    category: "Frutas y verduras",   current_price: 35.00,  preferred_supplier_id: IDS.sup.verduras },
    { id: IDS.ing.champiñones,   org_id: IDS.org, name: "Champiñones frescos",       unit: "kg",    category: "Frutas y verduras",   current_price: 85.00,  preferred_supplier_id: IDS.sup.verduras },
    { id: IDS.ing.aguacate,      org_id: IDS.org, name: "Aguacate Hass",             unit: "pza",   category: "Frutas y verduras",   current_price: 18.00,  preferred_supplier_id: IDS.sup.verduras },
    { id: IDS.ing.limon,         org_id: IDS.org, name: "Limón persa",               unit: "kg",    category: "Frutas y verduras",   current_price: 28.00,  preferred_supplier_id: IDS.sup.verduras },
    { id: IDS.ing.zanahoria,     org_id: IDS.org, name: "Zanahoria",                 unit: "kg",    category: "Frutas y verduras",   current_price: 25.00,  preferred_supplier_id: IDS.sup.verduras },
    { id: IDS.ing.brocoli,       org_id: IDS.org, name: "Brócoli",                   unit: "kg",    category: "Frutas y verduras",   current_price: 42.00,  preferred_supplier_id: IDS.sup.verduras },
    { id: IDS.ing.lechuga,       org_id: IDS.org, name: "Lechuga romana",            unit: "pza",   category: "Frutas y verduras",   current_price: 28.00,  preferred_supplier_id: IDS.sup.verduras },
    { id: IDS.ing.cilantro,      org_id: IDS.org, name: "Cilantro fresco",           unit: "manojo",category: "Frutas y verduras",   current_price: 12.00,  preferred_supplier_id: IDS.sup.verduras },
    { id: IDS.ing.perejil,       org_id: IDS.org, name: "Perejil liso",              unit: "manojo",category: "Frutas y verduras",   current_price: 10.00,  preferred_supplier_id: IDS.sup.verduras },
    // Lácteos
    { id: IDS.ing.crema,         org_id: IDS.org, name: "Crema ácida",               unit: "l", category: "Lácteos y huevos",    current_price: 52.00,  preferred_supplier_id: IDS.sup.lacteos },
    { id: IDS.ing.crema_batir,   org_id: IDS.org, name: "Crema para batir 35%",      unit: "l", category: "Lácteos y huevos",    current_price: 78.00,  preferred_supplier_id: IDS.sup.lacteos },
    { id: IDS.ing.queso_fresco,  org_id: IDS.org, name: "Queso fresco artesanal",    unit: "kg",    category: "Lácteos y huevos",    current_price: 98.00,  preferred_supplier_id: IDS.sup.lacteos },
    { id: IDS.ing.mantequilla,   org_id: IDS.org, name: "Mantequilla sin sal",       unit: "kg",    category: "Lácteos y huevos",    current_price: 175.00, preferred_supplier_id: IDS.sup.lacteos },
    { id: IDS.ing.leche,         org_id: IDS.org, name: "Leche entera",              unit: "l", category: "Lácteos y huevos",    current_price: 28.00,  preferred_supplier_id: IDS.sup.lacteos },
    { id: IDS.ing.huevo,         org_id: IDS.org, name: "Huevo blanco L",            unit: "pza", category: "Lácteos y huevos",    current_price: 4.50,   preferred_supplier_id: IDS.sup.lacteos },
    // Abarrotes
    { id: IDS.ing.aceite_oliva,  org_id: IDS.org, name: "Aceite de oliva extra virgen", unit: "l", category: "Abarrotes y secos", current_price: 198.00, preferred_supplier_id: IDS.sup.abarrotes },
    { id: IDS.ing.arroz,         org_id: IDS.org, name: "Arroz blanco de grano largo",  unit: "kg",    category: "Abarrotes y secos", current_price: 32.00,  preferred_supplier_id: IDS.sup.abarrotes },
    { id: IDS.ing.frijol,        org_id: IDS.org, name: "Frijol negro",               unit: "kg",    category: "Abarrotes y secos", current_price: 38.00,  preferred_supplier_id: IDS.sup.abarrotes },
    { id: IDS.ing.harina,        org_id: IDS.org, name: "Harina de trigo",            unit: "kg",    category: "Abarrotes y secos", current_price: 22.00,  preferred_supplier_id: IDS.sup.abarrotes },
    { id: IDS.ing.azucar,        org_id: IDS.org, name: "Azúcar blanca",              unit: "kg",    category: "Abarrotes y secos", current_price: 26.00,  preferred_supplier_id: IDS.sup.abarrotes },
    { id: IDS.ing.vino_blanco,   org_id: IDS.org, name: "Vino blanco seco para cocinar", unit: "l", category: "Vinos y licores",   current_price: 185.00, preferred_supplier_id: IDS.sup.vinos },
    // Especias
    { id: IDS.ing.comino,        org_id: IDS.org, name: "Comino molido",              unit: "kg",    category: "Especias y condimentos",   current_price: 420.00, preferred_supplier_id: IDS.sup.especias },
    { id: IDS.ing.chile_ancho,   org_id: IDS.org, name: "Chile ancho seco",           unit: "kg",    category: "Especias y condimentos",   current_price: 220.00, preferred_supplier_id: IDS.sup.especias },
    // Panadería
    { id: IDS.ing.pan_baguette,  org_id: IDS.org, name: "Baguette artesanal",         unit: "pza", category: "Panadería y repostería",  current_price: 35.00,  preferred_supplier_id: IDS.sup.panaderia },
    // Postres
    { id: IDS.ing.cajeta,        org_id: IDS.org, name: "Cajeta queretana",            unit: "kg",    category: "Abarrotes y secos", current_price: 145.00, preferred_supplier_id: IDS.sup.abarrotes },
    { id: IDS.ing.chocolate,     org_id: IDS.org, name: "Chocolate oscuro 70%",        unit: "kg",    category: "Abarrotes y secos", current_price: 380.00, preferred_supplier_id: IDS.sup.abarrotes },
  ])
  ok("35 ingredientes", ingErr)

  // ── dishes ─────────────────────────────────────────────────────────────────
  console.log("\n🍽  Dishes")
  const { error: dishErr } = await supabase.from("dishes").insert([
    { id: IDS.dish.crema_poblano,     org_id: IDS.org, name: "Crema de Poblano",              category: "Sopa",     servings_yield: 1, notes: "Servir caliente con queso fresco y crema" },
    { id: IDS.dish.ensalada_cesar,    org_id: IDS.org, name: "Ensalada César Clásica",        category: "Ensalada",          servings_yield: 1, notes: "Aderezo casero, sin anchoas" },
    { id: IDS.dish.pollo_salsa_verde, org_id: IDS.org, name: "Pollo en Salsa Verde",          category: "Plato principal", servings_yield: 1, notes: "Salsa de tomatillo verde con chile serrano" },
    { id: IDS.dish.mole_pollo,        org_id: IDS.org, name: "Mole Queretano con Pollo",      category: "Plato principal", servings_yield: 1, notes: "Receta tradicional de la región, 24 ingredientes" },
    { id: IDS.dish.pollo_crema,       org_id: IDS.org, name: "Pollo a la Crema con Poblano",  category: "Plato principal", servings_yield: 1, notes: "Pechuga de pollo en salsa de crema y chile poblano" },
    { id: IDS.dish.filete_vino,       org_id: IDS.org, name: "Filete al Vino Tinto",          category: "Plato principal", servings_yield: 1, notes: "Filete de res con reducción de vino y champiñones" },
    { id: IDS.dish.arrachera,         org_id: IDS.org, name: "Arrachera a las Brasas",        category: "Plato principal", servings_yield: 1, notes: "Marinada 24 hrs, servir con guacamole" },
    { id: IDS.dish.lomo_ciruela,      org_id: IDS.org, name: "Lomo de Cerdo en Salsa de Ciruela", category: "Plato principal", servings_yield: 1, notes: "Con guarnición de puré de papa" },
    { id: IDS.dish.camaron_ajo,       org_id: IDS.org, name: "Camarones al Mojo de Ajo",      category: "Plato principal", servings_yield: 1, notes: "Camarón U/15 con mantequilla y ajo" },
    { id: IDS.dish.arroz_rojo,        org_id: IDS.org, name: "Arroz Rojo a la Mexicana",      category: "Guarnición",       servings_yield: 1, notes: "Con verduras y jitomate" },
    { id: IDS.dish.frijoles_olla,     org_id: IDS.org, name: "Frijoles de la Olla",           category: "Guarnición",       servings_yield: 1, notes: "Frijol negro con epazote" },
    { id: IDS.dish.verduras_vapor,    org_id: IDS.org, name: "Verduras al Vapor",             category: "Guarnición",       servings_yield: 1, notes: "Mix brócoli, zanahoria y ejotes" },
    { id: IDS.dish.flan_cajeta,       org_id: IDS.org, name: "Flan de Cajeta Queretana",      category: "Postre",            servings_yield: 1, notes: "Postre icónico de Querétaro" },
    { id: IDS.dish.tres_leches,       org_id: IDS.org, name: "Tres Leches Artesanal",         category: "Postre",            servings_yield: 1, notes: "Esponja bañada en tres lácteos" },
    { id: IDS.dish.mousse_chocolate,  org_id: IDS.org, name: "Mousse de Chocolate Oscuro",    category: "Postre",            servings_yield: 1, notes: "Chocolate 70%, crema batida" },
    { id: IDS.dish.guacamole,         org_id: IDS.org, name: "Guacamole Artesanal",           category: "Entrada",           servings_yield: 1, notes: "Aguacate, cilantro, limón y chile serrano" },
    { id: IDS.dish.caldo_res,         org_id: IDS.org, name: "Caldo de Res Queretano",        category: "Sopa",     servings_yield: 1, notes: "Nutritivo caldo con verduras de temporada" },
    { id: IDS.dish.carnitas,          org_id: IDS.org, name: "Carnitas Queretanas",            category: "Plato principal", servings_yield: 1, notes: "Cerdo confitado, servir con tortillas" },
    { id: IDS.dish.ceviche_camaron,   org_id: IDS.org, name: "Ceviche de Camarón",            category: "Entrada",           servings_yield: 1, notes: "Camarón, limón, jitomate, aguacate y cilantro" },
    { id: IDS.dish.pan_ajo,           org_id: IDS.org, name: "Pan al Ajo con Mantequilla",    category: "Entrada",           servings_yield: 1, notes: "Baguette artesanal tostado" },
  ])
  ok("20 platillos", dishErr)

  // ── recipe items ───────────────────────────────────────────────────────────
  console.log("\n📋  Recipe items")
  const recipeItems = [
    // Crema de Poblano (per portion)
    { dish_id: IDS.dish.crema_poblano,     ingredient_id: IDS.ing.chile_poblano, quantity: 0.08 },
    { dish_id: IDS.dish.crema_poblano,     ingredient_id: IDS.ing.crema,         quantity: 0.12 },
    { dish_id: IDS.dish.crema_poblano,     ingredient_id: IDS.ing.cebolla,       quantity: 0.03 },
    { dish_id: IDS.dish.crema_poblano,     ingredient_id: IDS.ing.ajo,           quantity: 0.005 },
    { dish_id: IDS.dish.crema_poblano,     ingredient_id: IDS.ing.mantequilla,   quantity: 0.015 },
    { dish_id: IDS.dish.crema_poblano,     ingredient_id: IDS.ing.queso_fresco,  quantity: 0.02 },
    // Ensalada César (per portion)
    { dish_id: IDS.dish.ensalada_cesar,    ingredient_id: IDS.ing.lechuga,       quantity: 0.4 },
    { dish_id: IDS.dish.ensalada_cesar,    ingredient_id: IDS.ing.pan_baguette,  quantity: 0.15 },
    { dish_id: IDS.dish.ensalada_cesar,    ingredient_id: IDS.ing.limon,         quantity: 0.04 },
    { dish_id: IDS.dish.ensalada_cesar,    ingredient_id: IDS.ing.queso_fresco,  quantity: 0.025 },
    { dish_id: IDS.dish.ensalada_cesar,    ingredient_id: IDS.ing.ajo,           quantity: 0.005 },
    // Pollo en Salsa Verde (per portion)
    { dish_id: IDS.dish.pollo_salsa_verde, ingredient_id: IDS.ing.pollo,         quantity: 0.22 },
    { dish_id: IDS.dish.pollo_salsa_verde, ingredient_id: IDS.ing.tomate_verde,  quantity: 0.12 },
    { dish_id: IDS.dish.pollo_salsa_verde, ingredient_id: IDS.ing.cebolla,       quantity: 0.04 },
    { dish_id: IDS.dish.pollo_salsa_verde, ingredient_id: IDS.ing.ajo,           quantity: 0.006 },
    { dish_id: IDS.dish.pollo_salsa_verde, ingredient_id: IDS.ing.cilantro,      quantity: 0.05 },
    { dish_id: IDS.dish.pollo_salsa_verde, ingredient_id: IDS.ing.crema,         quantity: 0.04 },
    // Pollo a la Crema (per portion)
    { dish_id: IDS.dish.pollo_crema,       ingredient_id: IDS.ing.pollo,         quantity: 0.22 },
    { dish_id: IDS.dish.pollo_crema,       ingredient_id: IDS.ing.chile_poblano, quantity: 0.07 },
    { dish_id: IDS.dish.pollo_crema,       ingredient_id: IDS.ing.crema,         quantity: 0.08 },
    { dish_id: IDS.dish.pollo_crema,       ingredient_id: IDS.ing.cebolla,       quantity: 0.04 },
    { dish_id: IDS.dish.pollo_crema,       ingredient_id: IDS.ing.mantequilla,   quantity: 0.02 },
    // Mole Queretano (per portion)
    { dish_id: IDS.dish.mole_pollo,        ingredient_id: IDS.ing.pollo,         quantity: 0.22 },
    { dish_id: IDS.dish.mole_pollo,        ingredient_id: IDS.ing.chile_ancho,   quantity: 0.02 },
    { dish_id: IDS.dish.mole_pollo,        ingredient_id: IDS.ing.jitomate,      quantity: 0.08 },
    { dish_id: IDS.dish.mole_pollo,        ingredient_id: IDS.ing.cebolla,       quantity: 0.04 },
    { dish_id: IDS.dish.mole_pollo,        ingredient_id: IDS.ing.chocolate,     quantity: 0.015 },
    { dish_id: IDS.dish.mole_pollo,        ingredient_id: IDS.ing.comino,        quantity: 0.002 },
    // Filete al Vino (per portion)
    { dish_id: IDS.dish.filete_vino,       ingredient_id: IDS.ing.filete,        quantity: 0.25 },
    { dish_id: IDS.dish.filete_vino,       ingredient_id: IDS.ing.vino_blanco,   quantity: 0.08 },
    { dish_id: IDS.dish.filete_vino,       ingredient_id: IDS.ing.champiñones,   quantity: 0.08 },
    { dish_id: IDS.dish.filete_vino,       ingredient_id: IDS.ing.mantequilla,   quantity: 0.03 },
    { dish_id: IDS.dish.filete_vino,       ingredient_id: IDS.ing.ajo,           quantity: 0.008 },
    // Arrachera (per portion)
    { dish_id: IDS.dish.arrachera,         ingredient_id: IDS.ing.arrachera,     quantity: 0.28 },
    { dish_id: IDS.dish.arrachera,         ingredient_id: IDS.ing.limon,         quantity: 0.04 },
    { dish_id: IDS.dish.arrachera,         ingredient_id: IDS.ing.ajo,           quantity: 0.008 },
    { dish_id: IDS.dish.arrachera,         ingredient_id: IDS.ing.cilantro,      quantity: 0.04 },
    // Lomo de cerdo (per portion)
    { dish_id: IDS.dish.lomo_ciruela,      ingredient_id: IDS.ing.lomo_cerdo,    quantity: 0.25 },
    { dish_id: IDS.dish.lomo_ciruela,      ingredient_id: IDS.ing.cebolla,       quantity: 0.04 },
    { dish_id: IDS.dish.lomo_ciruela,      ingredient_id: IDS.ing.ajo,           quantity: 0.006 },
    { dish_id: IDS.dish.lomo_ciruela,      ingredient_id: IDS.ing.mantequilla,   quantity: 0.025 },
    // Camarón al Mojo (per portion)
    { dish_id: IDS.dish.camaron_ajo,       ingredient_id: IDS.ing.camaron,       quantity: 0.18 },
    { dish_id: IDS.dish.camaron_ajo,       ingredient_id: IDS.ing.mantequilla,   quantity: 0.04 },
    { dish_id: IDS.dish.camaron_ajo,       ingredient_id: IDS.ing.ajo,           quantity: 0.01 },
    { dish_id: IDS.dish.camaron_ajo,       ingredient_id: IDS.ing.limon,         quantity: 0.03 },
    { dish_id: IDS.dish.camaron_ajo,       ingredient_id: IDS.ing.perejil,       quantity: 0.05 },
    // Arroz Rojo (per portion)
    { dish_id: IDS.dish.arroz_rojo,        ingredient_id: IDS.ing.arroz,         quantity: 0.08 },
    { dish_id: IDS.dish.arroz_rojo,        ingredient_id: IDS.ing.jitomate,      quantity: 0.05 },
    { dish_id: IDS.dish.arroz_rojo,        ingredient_id: IDS.ing.cebolla,       quantity: 0.02 },
    { dish_id: IDS.dish.arroz_rojo,        ingredient_id: IDS.ing.zanahoria,     quantity: 0.02 },
    { dish_id: IDS.dish.arroz_rojo,        ingredient_id: IDS.ing.aceite_oliva,  quantity: 0.01 },
    // Frijoles (per portion)
    { dish_id: IDS.dish.frijoles_olla,     ingredient_id: IDS.ing.frijol,        quantity: 0.07 },
    { dish_id: IDS.dish.frijoles_olla,     ingredient_id: IDS.ing.cebolla,       quantity: 0.02 },
    { dish_id: IDS.dish.frijoles_olla,     ingredient_id: IDS.ing.ajo,           quantity: 0.003 },
    // Verduras al vapor (per portion)
    { dish_id: IDS.dish.verduras_vapor,    ingredient_id: IDS.ing.brocoli,       quantity: 0.07 },
    { dish_id: IDS.dish.verduras_vapor,    ingredient_id: IDS.ing.zanahoria,     quantity: 0.05 },
    { dish_id: IDS.dish.verduras_vapor,    ingredient_id: IDS.ing.mantequilla,   quantity: 0.01 },
    // Flan de Cajeta (per portion)
    { dish_id: IDS.dish.flan_cajeta,       ingredient_id: IDS.ing.cajeta,        quantity: 0.06 },
    { dish_id: IDS.dish.flan_cajeta,       ingredient_id: IDS.ing.leche,         quantity: 0.12 },
    { dish_id: IDS.dish.flan_cajeta,       ingredient_id: IDS.ing.huevo,         quantity: 1.5 },
    { dish_id: IDS.dish.flan_cajeta,       ingredient_id: IDS.ing.azucar,        quantity: 0.05 },
    // Tres Leches (per portion)
    { dish_id: IDS.dish.tres_leches,       ingredient_id: IDS.ing.leche,         quantity: 0.1 },
    { dish_id: IDS.dish.tres_leches,       ingredient_id: IDS.ing.crema_batir,   quantity: 0.08 },
    { dish_id: IDS.dish.tres_leches,       ingredient_id: IDS.ing.huevo,         quantity: 1.0 },
    { dish_id: IDS.dish.tres_leches,       ingredient_id: IDS.ing.harina,        quantity: 0.04 },
    { dish_id: IDS.dish.tres_leches,       ingredient_id: IDS.ing.azucar,        quantity: 0.05 },
    // Mousse de chocolate (per portion)
    { dish_id: IDS.dish.mousse_chocolate,  ingredient_id: IDS.ing.chocolate,     quantity: 0.06 },
    { dish_id: IDS.dish.mousse_chocolate,  ingredient_id: IDS.ing.crema_batir,   quantity: 0.1 },
    { dish_id: IDS.dish.mousse_chocolate,  ingredient_id: IDS.ing.huevo,         quantity: 1.0 },
    { dish_id: IDS.dish.mousse_chocolate,  ingredient_id: IDS.ing.azucar,        quantity: 0.025 },
    // Guacamole (per portion)
    { dish_id: IDS.dish.guacamole,         ingredient_id: IDS.ing.aguacate,      quantity: 0.6 },
    { dish_id: IDS.dish.guacamole,         ingredient_id: IDS.ing.cilantro,      quantity: 0.04 },
    { dish_id: IDS.dish.guacamole,         ingredient_id: IDS.ing.limon,         quantity: 0.03 },
    { dish_id: IDS.dish.guacamole,         ingredient_id: IDS.ing.cebolla,       quantity: 0.03 },
    // Pan al ajo (per portion)
    { dish_id: IDS.dish.pan_ajo,           ingredient_id: IDS.ing.pan_baguette,  quantity: 0.35 },
    { dish_id: IDS.dish.pan_ajo,           ingredient_id: IDS.ing.mantequilla,   quantity: 0.025 },
    { dish_id: IDS.dish.pan_ajo,           ingredient_id: IDS.ing.ajo,           quantity: 0.008 },
    { dish_id: IDS.dish.pan_ajo,           ingredient_id: IDS.ing.perejil,       quantity: 0.04 },
    // Ceviche de Camarón (per portion)
    { dish_id: IDS.dish.ceviche_camaron,   ingredient_id: IDS.ing.camaron,       quantity: 0.12 },
    { dish_id: IDS.dish.ceviche_camaron,   ingredient_id: IDS.ing.limon,         quantity: 0.08 },
    { dish_id: IDS.dish.ceviche_camaron,   ingredient_id: IDS.ing.jitomate,      quantity: 0.05 },
    { dish_id: IDS.dish.ceviche_camaron,   ingredient_id: IDS.ing.aguacate,      quantity: 0.3 },
    { dish_id: IDS.dish.ceviche_camaron,   ingredient_id: IDS.ing.cilantro,      quantity: 0.04 },
    // Carnitas (per portion)
    { dish_id: IDS.dish.carnitas,          ingredient_id: IDS.ing.lomo_cerdo,    quantity: 0.22 },
    { dish_id: IDS.dish.carnitas,          ingredient_id: IDS.ing.ajo,           quantity: 0.006 },
    { dish_id: IDS.dish.carnitas,          ingredient_id: IDS.ing.limon,         quantity: 0.03 },
    { dish_id: IDS.dish.carnitas,          ingredient_id: IDS.ing.cilantro,      quantity: 0.04 },
    // Caldo de res (per portion)
    { dish_id: IDS.dish.caldo_res,         ingredient_id: IDS.ing.jitomate,      quantity: 0.06 },
    { dish_id: IDS.dish.caldo_res,         ingredient_id: IDS.ing.zanahoria,     quantity: 0.04 },
    { dish_id: IDS.dish.caldo_res,         ingredient_id: IDS.ing.cebolla,       quantity: 0.03 },
    { dish_id: IDS.dish.caldo_res,         ingredient_id: IDS.ing.ajo,           quantity: 0.005 },
  ]
  const { error: recipeErr } = await supabase.from("recipe_items").insert(recipeItems)
  ok(`${recipeItems.length} recipe items`, recipeErr)

  // ── indirect cost categories ───────────────────────────────────────────────
  console.log("\n💰  Indirect cost categories")
  const { error: icatErr } = await supabase.from("indirect_cost_categories").insert([
    // Reglas por evento (allocation_method válido: fixed | per_guest | percentage)
    { id: IDS.icat.renta_equipo, org_id: IDS.org, name: "Renta de equipo",    allocation_method: "fixed",      default_amount: 3500.00, description: "Loza, cubiertos, mesas y sillas adicionales" },
    { id: IDS.icat.logistica,    org_id: IDS.org, name: "Logística y flete",   allocation_method: "fixed",      default_amount: 1800.00, description: "Transporte de equipo e insumos al venue" },
    { id: IDS.icat.decoracion,   org_id: IDS.org, name: "Decoración de mesas", allocation_method: "per_guest",  default_amount: 85.00,   description: "Centros de mesa y mantelería especial" },
    { id: IDS.icat.cristaleria,  org_id: IDS.org, name: "Cristalería premium", allocation_method: "per_guest",  default_amount: 45.00,   description: "Copas de vino y cristalería de lujo" },
    { id: IDS.icat.gas_cocina,   org_id: IDS.org, name: "Gas para cocina",     allocation_method: "percentage", default_amount: 2.5,     description: "2.5% del total de la cotización" },
    // Servicios (costos indirectos por evento)
    { org_id: IDS.org, name: "Seguridad",               allocation_method: "fixed", default_amount: 3500.00, description: "Servicio de seguridad para el evento" },
    { org_id: IDS.org, name: "Valet parking",           allocation_method: "fixed", default_amount: 2800.00, description: "Servicio de valet" },
    { org_id: IDS.org, name: "DJ / Música",             allocation_method: "fixed", default_amount: 6000.00, description: "DJ, sonido o grupo en vivo" },
    { org_id: IDS.org, name: "Mobiliario y equipo",     allocation_method: "fixed", default_amount: 4500.00, description: "Renta de mobiliario, vajilla, carpas" },
    { org_id: IDS.org, name: "Limpieza",                allocation_method: "fixed", default_amount: 1800.00, description: "Servicio de limpieza post-evento" },
    { org_id: IDS.org, name: "Transporte / Logística",  allocation_method: "fixed", default_amount: 2500.00, description: "Traslado de equipo y personal" },
  ])
  ok("categorías de costos indirectos y servicios", icatErr)

  // Servicios semanales prorrateados (gastos generales tipo 'service' por semana)
  const { error: svcErr } = await supabase.from("overhead_expenses").insert([
    { org_id: IDS.org, concept: "Vigilancia semanal",            amount: 4200, period: "2026-06-08", period_type: "week", kind: "service", notes: "Guardia fija de fin de semana" },
    { org_id: IDS.org, concept: "Renta de mobiliario (semana)",  amount: 7500, period: "2026-06-08", period_type: "week", kind: "service", notes: "Sillas, mesas y carpas" },
  ])
  ok("servicios semanales", svcErr)

  // ── staff ──────────────────────────────────────────────────────────────────
  console.log("\n👥  Staff members")
  const { error: staffErr } = await supabase.from("staff_members").insert([
    { id: IDS.staff.roberto,  org_id: IDS.org, name: "Roberto García",    position: "Chef ejecutivo",       rate: 1800.00, rate_type: "daily",  phone: "442-111-0001", notes: "15 años de experiencia, especialista en cocina mexicana contemporánea" },
    { id: IDS.staff.ana,      org_id: IDS.org, name: "Ana Morales",       position: "Sous chef",            rate: 1200.00, rate_type: "daily",  phone: "442-111-0002", notes: "Especialista en repostería y salsas" },
    { id: IDS.staff.miguel,   org_id: IDS.org, name: "Miguel Torres",     position: "Cocinero",             rate:  800.00, rate_type: "daily",  phone: "442-111-0003" },
    { id: IDS.staff.carmen,   org_id: IDS.org, name: "Carmen Ruiz",       position: "Cocinero",             rate:  800.00, rate_type: "daily",  phone: "442-111-0004", notes: "Especialista en carnes y cortes" },
    { id: IDS.staff.luis,     org_id: IDS.org, name: "Luis Hernández",    position: "Mesero",               rate:  130.00, rate_type: "hourly", phone: "442-111-0005" },
    { id: IDS.staff.sofia,    org_id: IDS.org, name: "Sofía Jiménez",     position: "Mesero",               rate:  130.00, rate_type: "hourly", phone: "442-111-0006" },
    { id: IDS.staff.carlos,   org_id: IDS.org, name: "Carlos Vega",       position: "Capitán",   rate:  950.00, rate_type: "daily",  phone: "442-111-0007", notes: "10 años de experiencia en eventos de lujo" },
    { id: IDS.staff.patricia, org_id: IDS.org, name: "Patricia López",    position: "Bartender",            rate:  160.00, rate_type: "hourly", phone: "442-111-0008", notes: "Mixología clásica y coctelería de autor" },
    { id: IDS.staff.jose,     org_id: IDS.org, name: "José Ramírez",      position: "Mesero",               rate:  130.00, rate_type: "hourly", phone: "442-111-0009" },
    { id: IDS.staff.diana,    org_id: IDS.org, name: "Diana Castro",      position: "Mesero",               rate:  130.00, rate_type: "hourly", phone: "442-111-0010" },
    { id: IDS.staff.fernando, org_id: IDS.org, name: "Fernando Ríos",     position: "Logística",            rate:  600.00, rate_type: "event",  phone: "442-111-0011", notes: "Montaje, transporte y desmontaje de equipo" },
    { id: IDS.staff.isabel,   org_id: IDS.org, name: "Isabel Méndez",     position: "Repostero",            rate:  900.00, rate_type: "daily",  phone: "442-111-0012", notes: "Pasteles de boda y postres artesanales" },
  ])
  ok("12 colaboradores", staffErr)

  // ── clients ────────────────────────────────────────────────────────────────
  console.log("\n🤝  Clients")
  const { error: clientErr } = await supabase.from("clients").insert([
    { id: IDS.client.garcia,  org_id: IDS.org, name: "Familia García-Martínez",      phone: "442-200-0001", email: "bodagarciamartinez@gmail.com",   notes: "Boda en Hacienda Galindo" },
    { id: IDS.client.morales, org_id: IDS.org, name: "Sra. Valentina Morales Vda.",  phone: "442-200-0002", email: "vmorales@hotmail.com",            notes: "XV años de su nieta Valentina" },
    { id: IDS.client.grupo,   org_id: IDS.org, name: "Grupo Industrial QRO",         phone: "442-200-0003", email: "eventos@grupoindustrialqro.com",  notes: "Empresa manufacturera, eventos anuales" },
    { id: IDS.client.lopez,   org_id: IDS.org, name: "Familia López-Hernández",      phone: "442-200-0004", email: "bodalopezhernandez@outlook.com",  notes: "Boda en Juriquilla" },
    { id: IDS.client.perez,   org_id: IDS.org, name: "Familia Pérez Domínguez",      phone: "442-200-0005", email: "fperezdominguez@gmail.com",       notes: "Graduación universitaria" },
    { id: IDS.client.cemex,   org_id: IDS.org, name: "CEMEX Querétaro",              phone: "442-200-0006", email: "rrhh.qro@cemex.com",              notes: "Cena aniversario 50 años" },
  ])
  ok("6 clientes", clientErr)

  // ── events ─────────────────────────────────────────────────────────────────
  console.log("\n🎉  Events")
  const { error: evErr } = await supabase.from("events").insert([
    { id: IDS.ev.boda_garcia,  org_id: IDS.org, client_id: IDS.client.garcia,  name: "Boda García-Martínez",              event_type: "Boda",              event_date: "2026-04-15", event_time: "14:00", location: "Hacienda Galindo, San Juan del Río",    guest_count: 180, status: "completado", notes: "Servicio completo: coctel, banquete, mesa de dulces y pastel" },
    { id: IDS.ev.xv_valentina, org_id: IDS.org, client_id: IDS.client.morales, name: "XV Años Valentina Morales",         event_type: "XV Años",           event_date: "2026-06-08", event_time: "19:00", location: "Salón Jardines de Querétaro, Qro.",      guest_count: 120, status: "contratado", notes: "Menú de 3 tiempos con barra de bebidas" },
    { id: IDS.ev.corp_grupo,   org_id: IDS.org, client_id: IDS.client.grupo,   name: "Convención Anual Grupo Industrial", event_type: "Evento corporativo",       event_date: "2026-05-30", event_time: "13:00", location: "Hotel Courtyard Querétaro, Qro.",        guest_count: 80,  status: "en_compras", notes: "Comida de negocios con presentaciones" },
    { id: IDS.ev.boda_lopez,   org_id: IDS.org, client_id: IDS.client.lopez,   name: "Boda López-Hernández",              event_type: "Boda",              event_date: "2026-06-20", event_time: "16:00", location: "Quinta El Nogal, Juriquilla, Qro.",      guest_count: 150, status: "en_requisicion", notes: "Servicio de coctel 2 hrs antes del banquete" },
    { id: IDS.ev.grad_perez,   org_id: IDS.org, client_id: IDS.client.perez,   name: "Graduación Familia Pérez",          event_type: "Evento social",       event_date: "2026-07-05", event_time: "14:00", location: "Casa particular, Lomas de Querétaro",   guest_count: 60,  status: "cotizado", notes: "Menú informal, sin protocolo de mesas" },
    { id: IDS.ev.cena_cemex,   org_id: IDS.org, client_id: IDS.client.cemex,   name: "Cena Aniversario CEMEX 50 años",    event_type: "Evento corporativo",  event_date: "2026-07-15", event_time: "20:00", location: "Planta CEMEX, Huichapan",                guest_count: 45,  status: "cotizado", notes: "Cena de gala, protocolo formal" },
  ])
  ok("6 eventos", evErr)

  // ── quotes ─────────────────────────────────────────────────────────────────
  console.log("\n📄  Quotes")

  // Boda García (completado) - quote aprobada
  const qBodaGarcia = "qq000001-0000-0000-0000-000000000001"
  const qXvValentina = "qq000002-0000-0000-0000-000000000001"
  const qCorpGrupo = "qq000003-0000-0000-0000-000000000001"
  const qBodaLopez = "qq000004-0000-0000-0000-000000000001"
  const qGradPerez = "qq000005-0000-0000-0000-000000000001"
  const qCenaCemex = "qq000006-0000-0000-0000-000000000001"

  const { error: quoteErr } = await supabase.from("quotes").insert([
    { id: qBodaGarcia,   event_id: IDS.ev.boda_garcia,  version_number: 1, status: "aprobada",  subtotal: 295200, discount_amount: 10200, total: 285000, margin_percent: 38 },
    { id: qXvValentina,  event_id: IDS.ev.xv_valentina, version_number: 1, status: "aprobada",  subtotal: 160000, discount_amount:  8000, total: 152000, margin_percent: 35 },
    { id: qCorpGrupo,    event_id: IDS.ev.corp_grupo,   version_number: 1, status: "aprobada",  subtotal: 100000, discount_amount:  2000, total:  98000, margin_percent: 32 },
    { id: qBodaLopez,    event_id: IDS.ev.boda_lopez,   version_number: 1, status: "aprobada",  subtotal: 205000, discount_amount:  7000, total: 198000, margin_percent: 36 },
    { id: qGradPerez,    event_id: IDS.ev.grad_perez,   version_number: 1, status: "borrador",  subtotal:  78000, discount_amount:  3000, total:  75000, margin_percent: 30 },
    { id: qCenaCemex,    event_id: IDS.ev.cena_cemex,   version_number: 1, status: "enviada",   subtotal:  65000, discount_amount:  3000, total:  62000, margin_percent: 33 },
  ])
  ok("6 cotizaciones", quoteErr)

  // Line items for quotes
  const { error: liErr } = await supabase.from("quote_line_items").insert([
    // Boda García (180 guests)
    { quote_id: qBodaGarcia, type: "dish", reference_id: IDS.dish.guacamole,         description: "Guacamole Artesanal × 180 porciones (coctel)", unit_cost:  22, quantity: 180, total_cost:  3960, sort_order: 0 },
    { quote_id: qBodaGarcia, type: "dish", reference_id: IDS.dish.ceviche_camaron,   description: "Ceviche de Camarón × 180 porciones (coctel)",  unit_cost:  48, quantity: 180, total_cost:  8640, sort_order: 1 },
    { quote_id: qBodaGarcia, type: "dish", reference_id: IDS.dish.crema_poblano,     description: "Crema de Poblano × 180 porciones",             unit_cost:  55, quantity: 180, total_cost:  9900, sort_order: 2 },
    { quote_id: qBodaGarcia, type: "dish", reference_id: IDS.dish.ensalada_cesar,    description: "Ensalada César × 180 porciones",               unit_cost:  42, quantity: 180, total_cost:  7560, sort_order: 3 },
    { quote_id: qBodaGarcia, type: "dish", reference_id: IDS.dish.filete_vino,       description: "Filete al Vino Tinto × 180 porciones",         unit_cost: 285, quantity: 180, total_cost: 51300, sort_order: 4 },
    { quote_id: qBodaGarcia, type: "dish", reference_id: IDS.dish.pollo_crema,       description: "Pollo a la Crema c/Poblano × 180 porciones",   unit_cost: 145, quantity: 180, total_cost: 26100, sort_order: 5 },
    { quote_id: qBodaGarcia, type: "dish", reference_id: IDS.dish.arroz_rojo,        description: "Arroz Rojo × 180 porciones",                   unit_cost:  35, quantity: 180, total_cost:  6300, sort_order: 6 },
    { quote_id: qBodaGarcia, type: "dish", reference_id: IDS.dish.frijoles_olla,     description: "Frijoles de la Olla × 180 porciones",          unit_cost:  28, quantity: 180, total_cost:  5040, sort_order: 7 },
    { quote_id: qBodaGarcia, type: "dish", reference_id: IDS.dish.flan_cajeta,       description: "Flan de Cajeta × 180 porciones",               unit_cost:  65, quantity: 180, total_cost: 11700, sort_order: 8 },
    { quote_id: qBodaGarcia, type: "other", reference_id: null,                      description: "Pastel de boda 5 pisos (personalizado)",       unit_cost: 8500, quantity: 1, total_cost:  8500, sort_order: 9 },
    { quote_id: qBodaGarcia, type: "other", reference_id: null,                      description: "Barra libre 6 hrs (180 personas)",             unit_cost: 320, quantity: 180, total_cost: 57600, sort_order: 10 },
    { quote_id: qBodaGarcia, type: "other", reference_id: null,                      description: "Servicio de personal (12 personas × 10 hrs)", unit_cost: 150, quantity: 120, total_cost: 18000, sort_order: 11 },
    // más detalles...
    { quote_id: qBodaGarcia, type: "other", reference_id: null,                      description: "Logística y transporte",                       unit_cost: 4500, quantity: 1, total_cost:  4500, sort_order: 12 },
    { quote_id: qBodaGarcia, type: "other", reference_id: null,                      description: "Renta de equipo (mesas, sillas, mantelería)",  unit_cost: 6200, quantity: 1, total_cost:  6200, sort_order: 13 },
    { quote_id: qBodaGarcia, type: "other", reference_id: null,                      description: "Coordinación y supervisión del evento",        unit_cost: 9900, quantity: 1, total_cost:  9900, sort_order: 14 },

    // XV Valentina (120 guests)
    { quote_id: qXvValentina, type: "dish", reference_id: IDS.dish.guacamole,        description: "Guacamole Artesanal × 120 porciones",          unit_cost:  22, quantity: 120, total_cost:  2640, sort_order: 0 },
    { quote_id: qXvValentina, type: "dish", reference_id: IDS.dish.crema_poblano,    description: "Crema de Poblano × 120 porciones",             unit_cost:  55, quantity: 120, total_cost:  6600, sort_order: 1 },
    { quote_id: qXvValentina, type: "dish", reference_id: IDS.dish.pollo_salsa_verde,description: "Pollo en Salsa Verde × 120 porciones",         unit_cost: 135, quantity: 120, total_cost: 16200, sort_order: 2 },
    { quote_id: qXvValentina, type: "dish", reference_id: IDS.dish.arroz_rojo,       description: "Arroz Rojo × 120 porciones",                   unit_cost:  35, quantity: 120, total_cost:  4200, sort_order: 3 },
    { quote_id: qXvValentina, type: "dish", reference_id: IDS.dish.frijoles_olla,    description: "Frijoles de la Olla × 120 porciones",          unit_cost:  28, quantity: 120, total_cost:  3360, sort_order: 4 },
    { quote_id: qXvValentina, type: "dish", reference_id: IDS.dish.tres_leches,      description: "Tres Leches Artesanal × 120 porciones",        unit_cost:  58, quantity: 120, total_cost:  6960, sort_order: 5 },
    { quote_id: qXvValentina, type: "other", reference_id: null,                     description: "Pastel de XV años (decoración floral)",        unit_cost: 5500, quantity:  1, total_cost:  5500, sort_order: 6 },
    { quote_id: qXvValentina, type: "other", reference_id: null,                     description: "Barra de bebidas y ponche",                    unit_cost: 180, quantity: 120, total_cost: 21600, sort_order: 7 },
    { quote_id: qXvValentina, type: "other", reference_id: null,                     description: "Personal de servicio (8 personas × 8 hrs)",   unit_cost: 150, quantity:  64, total_cost:  9600, sort_order: 8 },
    { quote_id: qXvValentina, type: "other", reference_id: null,                     description: "Renta de equipo",                             unit_cost: 3500, quantity:   1, total_cost:  3500, sort_order: 9 },

    // Corp Grupo (80 guests)
    { quote_id: qCorpGrupo, type: "dish", reference_id: IDS.dish.ensalada_cesar,     description: "Ensalada César × 80 porciones",                unit_cost:  42, quantity:  80, total_cost:  3360, sort_order: 0 },
    { quote_id: qCorpGrupo, type: "dish", reference_id: IDS.dish.arrachera,          description: "Arrachera a las Brasas × 80 porciones",       unit_cost: 195, quantity:  80, total_cost: 15600, sort_order: 1 },
    { quote_id: qCorpGrupo, type: "dish", reference_id: IDS.dish.lomo_ciruela,       description: "Lomo de Cerdo en Salsa de Ciruela × 80",      unit_cost: 168, quantity:  80, total_cost: 13440, sort_order: 2 },
    { quote_id: qCorpGrupo, type: "dish", reference_id: IDS.dish.arroz_rojo,         description: "Arroz Rojo × 80 porciones",                    unit_cost:  35, quantity:  80, total_cost:  2800, sort_order: 3 },
    { quote_id: qCorpGrupo, type: "dish", reference_id: IDS.dish.verduras_vapor,     description: "Verduras al Vapor × 80 porciones",             unit_cost:  42, quantity:  80, total_cost:  3360, sort_order: 4 },
    { quote_id: qCorpGrupo, type: "dish", reference_id: IDS.dish.mousse_chocolate,   description: "Mousse de Chocolate × 80 porciones",           unit_cost:  62, quantity:  80, total_cost:  4960, sort_order: 5 },
    { quote_id: qCorpGrupo, type: "other", reference_id: null,                       description: "Café y bebidas de acompañamiento",             unit_cost:  85, quantity:  80, total_cost:  6800, sort_order: 6 },
    { quote_id: qCorpGrupo, type: "other", reference_id: null,                       description: "Personal de servicio",                         unit_cost: 150, quantity:  48, total_cost:  7200, sort_order: 7 },

    // Boda López (150 guests)
    { quote_id: qBodaLopez, type: "dish", reference_id: IDS.dish.guacamole,          description: "Guacamole × 150 (coctel)",                     unit_cost:  22, quantity: 150, total_cost:  3300, sort_order: 0 },
    { quote_id: qBodaLopez, type: "dish", reference_id: IDS.dish.pan_ajo,            description: "Pan al Ajo × 150 (coctel)",                    unit_cost:  28, quantity: 150, total_cost:  4200, sort_order: 1 },
    { quote_id: qBodaLopez, type: "dish", reference_id: IDS.dish.caldo_res,          description: "Caldo de Res × 150",                           unit_cost:  42, quantity: 150, total_cost:  6300, sort_order: 2 },
    { quote_id: qBodaLopez, type: "dish", reference_id: IDS.dish.mole_pollo,         description: "Mole Queretano × 150",                         unit_cost: 158, quantity: 150, total_cost: 23700, sort_order: 3 },
    { quote_id: qBodaLopez, type: "dish", reference_id: IDS.dish.arrachera,          description: "Arrachera × 150",                             unit_cost: 195, quantity: 150, total_cost: 29250, sort_order: 4 },
    { quote_id: qBodaLopez, type: "dish", reference_id: IDS.dish.arroz_rojo,         description: "Arroz Rojo × 150",                             unit_cost:  35, quantity: 150, total_cost:  5250, sort_order: 5 },
    { quote_id: qBodaLopez, type: "dish", reference_id: IDS.dish.frijoles_olla,      description: "Frijoles × 150",                              unit_cost:  28, quantity: 150, total_cost:  4200, sort_order: 6 },
    { quote_id: qBodaLopez, type: "dish", reference_id: IDS.dish.tres_leches,        description: "Tres Leches × 150",                           unit_cost:  58, quantity: 150, total_cost:  8700, sort_order: 7 },
    { quote_id: qBodaLopez, type: "other", reference_id: null,                       description: "Barra libre 5 hrs",                            unit_cost: 290, quantity: 150, total_cost: 43500, sort_order: 8 },
    { quote_id: qBodaLopez, type: "other", reference_id: null,                       description: "Personal de servicio",                         unit_cost: 150, quantity: 100, total_cost: 15000, sort_order: 9 },
    { quote_id: qBodaLopez, type: "other", reference_id: null,                       description: "Renta de equipo y logística",                  unit_cost: 5600, quantity:  1, total_cost:  5600, sort_order: 10 },

    // Grad Pérez (60 guests)
    { quote_id: qGradPerez, type: "dish", reference_id: IDS.dish.pollo_salsa_verde,  description: "Pollo en Salsa Verde × 60",                    unit_cost: 135, quantity:  60, total_cost:  8100, sort_order: 0 },
    { quote_id: qGradPerez, type: "dish", reference_id: IDS.dish.camaron_ajo,        description: "Camarones al Mojo de Ajo × 60",               unit_cost: 185, quantity:  60, total_cost: 11100, sort_order: 1 },
    { quote_id: qGradPerez, type: "dish", reference_id: IDS.dish.arroz_rojo,         description: "Arroz Rojo × 60",                              unit_cost:  35, quantity:  60, total_cost:  2100, sort_order: 2 },
    { quote_id: qGradPerez, type: "dish", reference_id: IDS.dish.ensalada_cesar,     description: "Ensalada César × 60",                          unit_cost:  42, quantity:  60, total_cost:  2520, sort_order: 3 },
    { quote_id: qGradPerez, type: "dish", reference_id: IDS.dish.flan_cajeta,        description: "Flan de Cajeta × 60",                          unit_cost:  65, quantity:  60, total_cost:  3900, sort_order: 4 },
    { quote_id: qGradPerez, type: "other", reference_id: null,                       description: "Bebidas y agua",                               unit_cost:  90, quantity:  60, total_cost:  5400, sort_order: 5 },
    { quote_id: qGradPerez, type: "other", reference_id: null,                       description: "Personal de servicio (4 personas × 6 hrs)",   unit_cost: 150, quantity:  24, total_cost:  3600, sort_order: 6 },

    // Cena CEMEX (45 guests)
    { quote_id: qCenaCemex, type: "dish", reference_id: IDS.dish.ceviche_camaron,    description: "Ceviche de Camarón × 45 (entrada)",            unit_cost:  48, quantity:  45, total_cost:  2160, sort_order: 0 },
    { quote_id: qCenaCemex, type: "dish", reference_id: IDS.dish.crema_poblano,      description: "Crema de Poblano × 45",                        unit_cost:  55, quantity:  45, total_cost:  2475, sort_order: 1 },
    { quote_id: qCenaCemex, type: "dish", reference_id: IDS.dish.filete_vino,        description: "Filete al Vino Tinto × 45",                   unit_cost: 285, quantity:  45, total_cost: 12825, sort_order: 2 },
    { quote_id: qCenaCemex, type: "dish", reference_id: IDS.dish.camaron_ajo,        description: "Camarones al Mojo de Ajo × 45",               unit_cost: 185, quantity:  45, total_cost:  8325, sort_order: 3 },
    { quote_id: qCenaCemex, type: "dish", reference_id: IDS.dish.verduras_vapor,     description: "Verduras al Vapor × 45",                       unit_cost:  42, quantity:  45, total_cost:  1890, sort_order: 4 },
    { quote_id: qCenaCemex, type: "dish", reference_id: IDS.dish.mousse_chocolate,   description: "Mousse de Chocolate × 45",                     unit_cost:  62, quantity:  45, total_cost:  2790, sort_order: 5 },
    { quote_id: qCenaCemex, type: "other", reference_id: null,                       description: "Maridaje de vinos (3 botellas por mesa)",      unit_cost: 1800, quantity:  5, total_cost:  9000, sort_order: 6 },
    { quote_id: qCenaCemex, type: "other", reference_id: null,                       description: "Personal de servicio (6 personas × 5 hrs)",   unit_cost: 150, quantity:  30, total_cost:  4500, sort_order: 7 },
  ])
  ok("Line items cotizaciones", liErr)

  // ── payment schedules ──────────────────────────────────────────────────────
  console.log("\n💳  Payment schedules")
  const { error: payErr } = await supabase.from("payment_schedules").insert([
    // Boda García (completado - todos pagados)
    { event_id: IDS.ev.boda_garcia,  description: "Anticipo 30%",      amount:  85500, due_date: "2026-02-15", status: "pagado", paid_at: "2026-02-14", paid_amount:  85500, reference: "TRF-001234", sort_order: 0 },
    { event_id: IDS.ev.boda_garcia,  description: "Segundo pago 40%",  amount: 114000, due_date: "2026-03-15", status: "pagado", paid_at: "2026-03-13", paid_amount: 114000, reference: "TRF-002345", sort_order: 1 },
    { event_id: IDS.ev.boda_garcia,  description: "Pago final 30%",    amount:  85500, due_date: "2026-04-10", status: "pagado", paid_at: "2026-04-09", paid_amount:  85500, reference: "TRF-003456", sort_order: 2 },
    // XV Valentina (contratado - anticipo pagado)
    { event_id: IDS.ev.xv_valentina, description: "Anticipo 30%",      amount:  45600, due_date: "2026-04-08", status: "pagado", paid_at: "2026-04-07", paid_amount: 45600, reference: "CHEQ-0012",  sort_order: 0 },
    { event_id: IDS.ev.xv_valentina, description: "Segundo pago 40%",  amount:  60800, due_date: "2026-05-08", status: "pendiente",                                                                    sort_order: 1 },
    { event_id: IDS.ev.xv_valentina, description: "Pago final 30%",    amount:  45600, due_date: "2026-06-03", status: "pendiente",                                                                    sort_order: 2 },
    // Corp Grupo (en_compras - anticipo pagado)
    { event_id: IDS.ev.corp_grupo,   description: "Anticipo 50%",      amount:  49000, due_date: "2026-05-01", status: "pagado", paid_at: "2026-04-30", paid_amount: 49000, reference: "TRF-004567",  sort_order: 0 },
    { event_id: IDS.ev.corp_grupo,   description: "Pago final 50%",    amount:  49000, due_date: "2026-05-28", status: "pendiente",                                                                    sort_order: 1 },
    // Boda López (en_requisicion)
    { event_id: IDS.ev.boda_lopez,   description: "Anticipo 30%",      amount:  59400, due_date: "2026-04-20", status: "pagado", paid_at: "2026-04-19", paid_amount: 59400, reference: "TRF-005678",  sort_order: 0 },
    { event_id: IDS.ev.boda_lopez,   description: "Segundo pago 40%",  amount:  79200, due_date: "2026-05-20", status: "pendiente",                                                                    sort_order: 1 },
    { event_id: IDS.ev.boda_lopez,   description: "Pago final 30%",    amount:  59400, due_date: "2026-06-15", status: "pendiente",                                                                    sort_order: 2 },
    // Grad Pérez
    { event_id: IDS.ev.grad_perez,   description: "Anticipo 50%",      amount:  37500, due_date: "2026-06-05", status: "pendiente",                                                                    sort_order: 0 },
    { event_id: IDS.ev.grad_perez,   description: "Pago final 50%",    amount:  37500, due_date: "2026-07-01", status: "pendiente",                                                                    sort_order: 1 },
    // CEMEX
    { event_id: IDS.ev.cena_cemex,   description: "Pago único",        amount:  62000, due_date: "2026-07-10", status: "pendiente",                                                                    sort_order: 0 },
  ])
  ok("14 hitos de pago", payErr)

  // ── actual purchases for completed event ───────────────────────────────────
  console.log("\n🛒  Actual purchases (Boda García - completado)")
  const { error: apErr } = await supabase.from("actual_purchases").insert([
    { org_id: IDS.org, event_id: IDS.ev.boda_garcia, ingredient_id: IDS.ing.pollo,        quantity: 45.0,  unit: "kg",     unit_cost:  94.00, total_cost:  4230.00, purchased_at: "2026-04-08" },
    { org_id: IDS.org, event_id: IDS.ev.boda_garcia, ingredient_id: IDS.ing.filete,       quantity: 50.0,  unit: "kg",     unit_cost: 318.00, total_cost: 15900.00, purchased_at: "2026-04-08" },
    { org_id: IDS.org, event_id: IDS.ev.boda_garcia, ingredient_id: IDS.ing.camaron,      quantity: 22.0,  unit: "kg",     unit_cost: 385.00, total_cost:  8470.00, purchased_at: "2026-04-10" },
    { org_id: IDS.org, event_id: IDS.ev.boda_garcia, ingredient_id: IDS.ing.aguacate,     quantity: 110,   unit: "pza",    unit_cost:  19.00, total_cost:  2090.00, purchased_at: "2026-04-12" },
    { org_id: IDS.org, event_id: IDS.ev.boda_garcia, ingredient_id: IDS.ing.chile_poblano,quantity: 15.5,  unit: "kg",     unit_cost:  54.00, total_cost:   837.00, purchased_at: "2026-04-12" },
    { org_id: IDS.org, event_id: IDS.ev.boda_garcia, ingredient_id: IDS.ing.cebolla,      quantity: 25.0,  unit: "kg",     unit_cost:  24.00, total_cost:   600.00, purchased_at: "2026-04-12" },
    { org_id: IDS.org, event_id: IDS.ev.boda_garcia, ingredient_id: IDS.ing.jitomate,     quantity: 20.0,  unit: "kg",     unit_cost:  34.00, total_cost:   680.00, purchased_at: "2026-04-12" },
    { org_id: IDS.org, event_id: IDS.ev.boda_garcia, ingredient_id: IDS.ing.crema,        quantity: 28.0,  unit: "l",  unit_cost:  54.00, total_cost:  1512.00, purchased_at: "2026-04-12" },
    { org_id: IDS.org, event_id: IDS.ev.boda_garcia, ingredient_id: IDS.ing.queso_fresco, quantity: 10.0,  unit: "kg",     unit_cost:  99.00, total_cost:   990.00, purchased_at: "2026-04-12" },
    { org_id: IDS.org, event_id: IDS.ev.boda_garcia, ingredient_id: IDS.ing.arroz,        quantity: 18.0,  unit: "kg",     unit_cost:  33.00, total_cost:   594.00, purchased_at: "2026-04-12" },
    { org_id: IDS.org, event_id: IDS.ev.boda_garcia, ingredient_id: IDS.ing.frijol,       quantity: 14.0,  unit: "kg",     unit_cost:  39.00, total_cost:   546.00, purchased_at: "2026-04-12" },
    { org_id: IDS.org, event_id: IDS.ev.boda_garcia, ingredient_id: IDS.ing.mantequilla,  quantity:  8.5,  unit: "kg",     unit_cost: 178.00, total_cost:  1513.00, purchased_at: "2026-04-12" },
    { org_id: IDS.org, event_id: IDS.ev.boda_garcia, ingredient_id: IDS.ing.cajeta,       quantity: 12.0,  unit: "kg",     unit_cost: 148.00, total_cost:  1776.00, purchased_at: "2026-04-13" },
    { org_id: IDS.org, event_id: IDS.ev.boda_garcia, ingredient_id: IDS.ing.leche,        quantity: 25.0,  unit: "l",  unit_cost:  29.00, total_cost:   725.00, purchased_at: "2026-04-13" },
    { org_id: IDS.org, event_id: IDS.ev.boda_garcia, ingredient_id: IDS.ing.huevo,        quantity: 280,   unit: "pza",  unit_cost:   4.60, total_cost:  1288.00, purchased_at: "2026-04-13" },
    { org_id: IDS.org, event_id: IDS.ev.boda_garcia, ingredient_id: IDS.ing.lechuga,      quantity: 75,    unit: "pza",    unit_cost:  29.00, total_cost:  2175.00, purchased_at: "2026-04-13" },
    { org_id: IDS.org, event_id: IDS.ev.boda_garcia, ingredient_id: IDS.ing.limon,        quantity: 12.0,  unit: "kg",     unit_cost:  30.00, total_cost:   360.00, purchased_at: "2026-04-13" },
    { org_id: IDS.org, event_id: IDS.ev.boda_garcia, ingredient_id: IDS.ing.pan_baguette, quantity: 28,    unit: "pza",  unit_cost:  36.00, total_cost:  1008.00, purchased_at: "2026-04-13" },
    { org_id: IDS.org, event_id: IDS.ev.boda_garcia, ingredient_id: IDS.ing.vino_blanco,  quantity: 12.0,  unit: "l",  unit_cost: 188.00, total_cost:  2256.00, purchased_at: "2026-04-08" },
    { org_id: IDS.org, event_id: IDS.ev.boda_garcia, ingredient_id: IDS.ing.champiñones,  quantity: 15.0,  unit: "kg",     unit_cost:  87.00, total_cost:  1305.00, purchased_at: "2026-04-13" },
  ])
  ok("20 compras reales (Boda García)", apErr)

  // ── indirect costs for completed event ────────────────────────────────────
  console.log("\n💸  Indirect costs (Boda García)")
  const { error: icErr } = await supabase.from("event_indirect_costs").insert([
    { org_id: IDS.org, event_id: IDS.ev.boda_garcia, category_id: IDS.icat.renta_equipo, amount:  6800, notes: "Mesas de cristal, sillas Tiffany, mantelería premium" },
    { org_id: IDS.org, event_id: IDS.ev.boda_garcia, category_id: IDS.icat.logistica,    amount:  2400, notes: "Dos viajes con camioneta para montaje y desmontaje" },
    { org_id: IDS.org, event_id: IDS.ev.boda_garcia, category_id: IDS.icat.decoracion,   amount:  3240, notes: "180 personas × $18 mantelería especial" },
    { org_id: IDS.org, event_id: IDS.ev.boda_garcia, category_id: IDS.icat.cristaleria,  amount:  2700, notes: "180 personas × $15 copas de cristal Bohemia" },
    { org_id: IDS.org, event_id: IDS.ev.boda_garcia, category_id: IDS.icat.gas_cocina,   amount:  7125, notes: "2.5% de $285,000 = $7,125" },
  ])
  ok("5 costos indirectos (Boda García)", icErr)

  // ── staff assignments for completed event ──────────────────────────────────
  console.log("\n👥  Staff assignments (Boda García)")
  const { error: saErr } = await supabase.from("event_staff_assignments").insert([
    { org_id: IDS.org, event_id: IDS.ev.boda_garcia, staff_member_id: IDS.staff.roberto,  role: "Chef Ejecutivo",    call_time: "08:00", estimated_hours: 12, computed_cost: 1800.00 },
    { org_id: IDS.org, event_id: IDS.ev.boda_garcia, staff_member_id: IDS.staff.ana,      role: "Sous Chef / Postres", call_time: "08:00", estimated_hours: 12, computed_cost: 1200.00 },
    { org_id: IDS.org, event_id: IDS.ev.boda_garcia, staff_member_id: IDS.staff.miguel,   role: "Cocinero - carnes", call_time: "09:00", estimated_hours: 10, computed_cost:  800.00 },
    { org_id: IDS.org, event_id: IDS.ev.boda_garcia, staff_member_id: IDS.staff.carmen,   role: "Cocinera - salsas", call_time: "09:00", estimated_hours: 10, computed_cost:  800.00 },
    { org_id: IDS.org, event_id: IDS.ev.boda_garcia, staff_member_id: IDS.staff.carlos,   role: "Capitán de servicio", call_time: "12:00", estimated_hours: 10, computed_cost:  950.00 },
    { org_id: IDS.org, event_id: IDS.ev.boda_garcia, staff_member_id: IDS.staff.luis,     role: "Mesero",            call_time: "13:00", estimated_hours: 9,  computed_cost: 1170.00 },
    { org_id: IDS.org, event_id: IDS.ev.boda_garcia, staff_member_id: IDS.staff.sofia,    role: "Mesera",            call_time: "13:00", estimated_hours: 9,  computed_cost: 1170.00 },
    { org_id: IDS.org, event_id: IDS.ev.boda_garcia, staff_member_id: IDS.staff.jose,     role: "Mesero",            call_time: "13:00", estimated_hours: 9,  computed_cost: 1170.00 },
    { org_id: IDS.org, event_id: IDS.ev.boda_garcia, staff_member_id: IDS.staff.diana,    role: "Mesera",            call_time: "13:00", estimated_hours: 9,  computed_cost: 1170.00 },
    { org_id: IDS.org, event_id: IDS.ev.boda_garcia, staff_member_id: IDS.staff.patricia, role: "Bartender barra libre", call_time: "14:00", estimated_hours: 8, computed_cost: 1280.00 },
    { org_id: IDS.org, event_id: IDS.ev.boda_garcia, staff_member_id: IDS.staff.fernando, role: "Montaje y logística", call_time: "07:00", estimated_hours: 14, computed_cost:  600.00 },
    { org_id: IDS.org, event_id: IDS.ev.boda_garcia, staff_member_id: IDS.staff.isabel,   role: "Pastel y postres",  call_time: "08:00", estimated_hours: 12, computed_cost:  900.00 },
  ])
  ok("12 asignaciones de personal (Boda García)", saErr)

  // ── requisition for en_requisicion event ──────────────────────────────────
  console.log("\n📋  Requisition (Boda López)")
  const reqId = "rr000001-0000-0000-0000-000000000001"
  const { error: reqErr } = await supabase.from("requisitions").insert([
    { id: reqId, org_id: IDS.org, event_id: IDS.ev.boda_lopez, status: "aprobada", notes: "Requisición generada automáticamente desde cotización aprobada" },
  ])
  ok("Requisición Boda López", reqErr)

  const { error: riErr } = await supabase.from("requisition_items").insert([
    { requisition_id: reqId, ingredient_id: IDS.ing.lomo_cerdo,  quantity:  37.5, unit: "kg",     unit_cost: 158.00, total_cost:  5925.00 },
    { requisition_id: reqId, ingredient_id: IDS.ing.arrachera,   quantity:  42.0, unit: "kg",     unit_cost: 262.00, total_cost: 11004.00 },
    { requisition_id: reqId, ingredient_id: IDS.ing.pollo,       quantity:  33.0, unit: "kg",     unit_cost:  92.00, total_cost:  3036.00 },
    { requisition_id: reqId, ingredient_id: IDS.ing.chile_ancho, quantity:   3.0, unit: "kg",     unit_cost: 220.00, total_cost:   660.00 },
    { requisition_id: reqId, ingredient_id: IDS.ing.jitomate,    quantity:  12.0, unit: "kg",     unit_cost:  32.00, total_cost:   384.00 },
    { requisition_id: reqId, ingredient_id: IDS.ing.cebolla,     quantity:  16.5, unit: "kg",     unit_cost:  22.00, total_cost:   363.00 },
    { requisition_id: reqId, ingredient_id: IDS.ing.aguacate,    quantity:  90,   unit: "pza",    unit_cost:  18.00, total_cost:  1620.00 },
    { requisition_id: reqId, ingredient_id: IDS.ing.arroz,       quantity:  12.0, unit: "kg",     unit_cost:  32.00, total_cost:   384.00 },
    { requisition_id: reqId, ingredient_id: IDS.ing.frijol,      quantity:  10.5, unit: "kg",     unit_cost:  38.00, total_cost:   399.00 },
    { requisition_id: reqId, ingredient_id: IDS.ing.crema_batir, quantity:  13.5, unit: "l",  unit_cost:  78.00, total_cost:  1053.00 },
    { requisition_id: reqId, ingredient_id: IDS.ing.leche,       quantity:  18.0, unit: "l",  unit_cost:  28.00, total_cost:   504.00 },
    { requisition_id: reqId, ingredient_id: IDS.ing.huevo,       quantity: 225,   unit: "pza",  unit_cost:   4.50, total_cost:  1012.50 },
    { requisition_id: reqId, ingredient_id: IDS.ing.cilantro,    quantity:   9.0, unit: "manojo", unit_cost:  12.00, total_cost:   108.00 },
    { requisition_id: reqId, ingredient_id: IDS.ing.pan_baguette,quantity:  22,   unit: "pza",  unit_cost:  35.00, total_cost:   770.00 },
  ])
  ok("14 items de requisición (Boda López)", riErr)

  // ── staff assignments for upcoming events ──────────────────────────────────
  console.log("\n👥  Staff assignments (XV Valentina)")
  const { error: sa2Err } = await supabase.from("event_staff_assignments").insert([
    { org_id: IDS.org, event_id: IDS.ev.xv_valentina, staff_member_id: IDS.staff.roberto,  role: "Chef Ejecutivo",   call_time: "11:00", estimated_hours: 10, computed_cost: 1800.00 },
    { org_id: IDS.org, event_id: IDS.ev.xv_valentina, staff_member_id: IDS.staff.isabel,   role: "Pastel de XV",     call_time: "10:00", estimated_hours: 10, computed_cost:  900.00 },
    { org_id: IDS.org, event_id: IDS.ev.xv_valentina, staff_member_id: IDS.staff.carlos,   role: "Capitán servicio", call_time: "17:00", estimated_hours:  8, computed_cost:  950.00 },
    { org_id: IDS.org, event_id: IDS.ev.xv_valentina, staff_member_id: IDS.staff.luis,     role: "Mesero",           call_time: "18:00", estimated_hours:  7, computed_cost:  910.00 },
    { org_id: IDS.org, event_id: IDS.ev.xv_valentina, staff_member_id: IDS.staff.sofia,    role: "Mesera",           call_time: "18:00", estimated_hours:  7, computed_cost:  910.00 },
    { org_id: IDS.org, event_id: IDS.ev.xv_valentina, staff_member_id: IDS.staff.fernando, role: "Montaje",          call_time: "09:00", estimated_hours: 12, computed_cost:  600.00 },
  ])
  ok("6 asignaciones (XV Valentina)", sa2Err)

  console.log("\n✨  Seed completo!")
  console.log("\n📋  Credenciales de demo:")
  console.log("    Email:    admin@artesano.mx")
  console.log("    Password: ArtesanoDemo2024!")
  console.log("\n🎯  Datos cargados:")
  console.log("    • 8 proveedores | 35 ingredientes | 20 platillos con recetas")
  console.log("    • 12 colaboradores | 5 categorías de costos indirectos")
  console.log("    • 6 clientes | 6 eventos en todos los estados")
  console.log("    • Boda García-Martínez: P&L completo con compras reales y personal")
  console.log("    • Boda López-Hernández: Requisición aprobada lista para compras")
  console.log("    • XV Valentina Morales: Personal asignado, pagos en proceso")
}

seed().catch((e) => { console.error(e); process.exit(1) })
