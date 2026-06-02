# PLAN.md — Artesano Banquetes Management Software

## Project Summary

Internal management MVP for Artesano Banquetes, a catering company in Querétaro, MX. Goal: a polished, demo-ready product that impresses the client. All UI in Spanish (Mexico). Stack: Next.js (App Router) + TypeScript + Tailwind + Supabase + Vercel.

---

## Brand Design Tokens (extracted from brand PDF)

### Colors
```css
/* Primary palette */
--color-black:       #0F0F0F;  /* near-black, main text */
--color-dark:        #3C3C3C;  /* dark gray, secondary text */
--color-light:       #E5E5E5;  /* light gray, borders/dividers */
--color-cream:       #F3F0E9;  /* warm cream, main background */

/* Secondary palette — ingredients, earth, kitchen */
--color-sage:        #5E6B52;  /* olive/sage green */
--color-gold:        #C6A56B;  /* golden ochre — primary accent */
--color-terracotta:  #B46B4D;  /* terracotta/copper */
```

### Typography
- **Headings:** Playfair Display (Google Fonts)
- **Body:** Cormorant Garamond (Google Fonts)
- **UI / data:** Inter or system-ui (for tables, forms — high readability)

### Visual Identity
- Elegant, premium, artisanal. Think luxury gastronomy magazine.
- Textures: wood, linen, ceramic, stone. Natural lighting. Close-up food photography.
- "A" lettermark as brand seal.

---

## Architecture Decisions

| Decision | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 App Router | SSR, file-based routing, server actions |
| DB / Auth | Supabase (PostgreSQL + RLS) | Realtime, built-in auth, storage |
| Styling | Tailwind CSS + CSS variables | Utility-first + brand tokens via vars |
| Components | shadcn/ui adapted to brand palette | Accessible, composable, no lock-in |
| PDF | @react-pdf/renderer or puppeteer | Quote/contract export |
| State | React Server Components + Zustand (light client state) | Minimal client JS |
| Deployment | Vercel (Next.js) + Supabase cloud | Managed, scalable |
| DNS | Hostinger → Vercel CNAME | Client's existing domain |

---

## Phase Breakdown

### Phase 0 — Scaffold
**Goal:** Running app with auth, layout, and design system.

Steps:
1. `npx create-next-app@latest` with TypeScript + Tailwind + App Router
2. Configure Tailwind with brand CSS variables + custom fonts (Playfair Display, Cormorant Garamond via `next/font/google`)
3. Install shadcn/ui, configure with brand palette
4. Supabase project setup + `.env.local` template
5. Supabase Auth (email/password) + middleware for protected routes
6. Shell layout: sidebar navigation + header + main content area
7. Base pages: login, dashboard placeholder, 404
8. First SQL migration: `organizations`, `profiles`, `module_settings`
9. `README.md` scaffold with install, env vars, deploy, DNS instructions

**Deliverable:** App runs, login works, sidebar visible, brand colors applied.

---

### Phase 1 — Master Catalogs
**Goal:** Full CRUD for all master data.

Modules:
- **Ingredients** — name, unit, category, current price, preferred supplier + price history chart
- **Suppliers** — name, contact, category, notes
- **Dishes** — name, category, yield (servings), image placeholder
  - Recipe editor: ingredient + quantity per serving (inline table)
- **Menus / Packages** — name, description, list of dishes + total estimated cost
- **Staff catalog** — name, position, daily/hourly rate
- **Indirect cost categories** — name, description, allocation method

SQL migrations for all catalog tables.

**Deliverable:** All catalogs navigable and functional with validation.

---

### Phase 2 — Events + Quote + Contract
**Goal:** Core event lifecycle.

**Events:**
- List with status filter + search
- Create event: client, date, location, guest count, type, notes
- Event detail page: timeline of status, tabs for each sub-module

**Clients (mini-catalog within Events):**
- Name, phone, email, notes

**Quote (7.3):**
- Quote builder: select dishes/menus, services, staff
- Auto-compute estimated ingredient cost per dish (recipe × current price × guest count)
- Sale price: by target margin % or manual override
- Discount field, subtotal, total
- Versioning (v1, v2…) and status (borrador → enviada → aprobada / rechazada)
- PDF export with brand header, line items, totals, terms

**Contract (7.4):**
- Generate from approved quote (one click)
- Editable clause blocks (rich text or structured fields)
- Client + event data auto-filled
- Signature placeholder section
- PDF export with brand styling

SQL migrations: `clients`, `events`, `quotes`, `quote_line_items`, `contracts`.

**Deliverable:** Can create event → build quote → approve → generate contract → export both to PDF.

---

### Phase 3 — Payment Schedule
**Goal:** Track financial commitments per event.

- Define milestones: deposit, installment(s), final payment
- Each milestone: amount, due date, status (pendiente / pagado / vencido)
- Auto-flag overdue payments (due date < today + unpaid)
- Dashboard alert strip for upcoming payments (within 7 days)
- Record actual payment: date, amount, reference/note

SQL migrations: `payment_schedules`, `payments`.

**Deliverable:** Payment timeline visible on event detail, alerts functional.

---

### Phase 4 — Requisition + Purchase Orders + Calendar
**Goal:** Automate pre-event purchasing workflow.

**Requisition (7.6):**
- Auto-generate 7 days before event (banner alert when within 7-day window)
- Recipe explosion: for each dish in event menu, qty = recipe_qty × guest_count
- Consolidate by ingredient (sum across all dishes)
- Value each line at current price → estimated total
- Status: generada → revisada → aprobada

**Purchase Orders (7.7):**
- Group requisition items by preferred supplier
- Generate one PO per supplier with line items + subtotal
- Purchasing calendar: visual timeline of "buy by" dates per PO (considering event date)
- Mark PO as received (date received, notes)

SQL migrations: `requisitions`, `requisition_items`, `purchase_orders`, `purchase_order_items`.

**Deliverable:** Requisition generates from event, POs created per supplier, calendar shows purchase timeline.

---

### Phase 5 — Actual vs. Estimate + Real Profit
**Goal:** Post-purchase variance analysis and profitability.

**Actual purchases (7.8):**
- Record actual amount paid per ingredient / PO
- Comparison table: estimated qty/price vs actual qty/price
- Variance column (absolute + %) with color coding (green = under budget, red = over)
- Totals row

**Real profit (7.9):**
- Income statement per event:
  - Revenue: quote total
  - Ingredient cost: actual purchases total
  - Staff cost: sum of (hours × rate) per assigned staff
  - Indirect costs: allocated amounts
  - = **Real profit** (MXN and %)
- Settings screen: configure indirect cost categories + allocation method (fixed amount per event, % of revenue, etc.)

SQL migrations: `actual_purchases`, `event_indirect_costs`.

**Deliverable:** Complete P&L view per event with variance vs estimate.

---

### Phase 6 — Event Staff Control
**Goal:** Assign and track staff per event.

- Assign staff members to event: role, call time, estimated hours
- Compute staff cost per event (rate × hours)
- Availability conflict detector: flag if same person assigned to two events on same day
- Staff cost feeds into Phase 5 profit calculation

SQL migrations: `event_staff_assignments`.

**Deliverable:** Staff roster per event, cost computed, conflict detection working.

---

### Phase 7 — Dashboard, Extras, Seed Data, Polish, Deploy
**Goal:** Demo-ready product.

**Dashboard (7.11):**
- KPIs: events this month, quoted revenue, confirmed revenue, average profit %, AR balance, upcoming requisitions
- Quick-access cards: next events, overdue payments, events needing requisition

**Optional modules (clearly labeled):**
- Event calendar with availability heatmap
- Reusable menu/package templates
- Event post-mortem notes
- Basic inventory/stock tracking

**Seed data:**
- 30–40 ingredients with MXN prices
- 8–10 suppliers
- 20+ dishes with full recipes
- 10+ staff members
- 5–6 events across all statuses (quoted → contracted → in-requisition → completed with P&L)
- Admin user: `admin@artesano.mx` / `ArtesanoDemo2024!`

**Polish:**
- Loading skeletons on all data-fetch pages
- Empty states with helpful CTAs
- Responsive layout (desktop-first, tablet-usable)
- Toast notifications for CRUD actions
- Error boundaries

**Deployment:**
- Vercel deploy + env vars configuration
- Custom domain instructions for Hostinger DNS → Vercel CNAME
- `README.md` complete

---

## Module Registry

Each module has a record in `module_settings` table:

| Key | Label | Default |
|---|---|---|
| `quotes` | Cotizaciones | enabled |
| `contracts` | Contratos | enabled |
| `payments` | Pagos | enabled |
| `requisitions` | Requisiciones | enabled |
| `purchase_orders` | Órdenes de Compra | enabled |
| `actual_purchases` | Compras Reales | enabled |
| `profit` | Utilidad Real | enabled |
| `staff` | Personal | enabled |
| `dashboard` | Dashboard | enabled |
| `calendar` | Calendario | optional |
| `templates` | Plantillas | optional |
| `postmortem` | Postmortem | optional |
| `inventory` | Inventario | optional |

---

## User Roles

| Role | Key | Permissions |
|---|---|---|
| Administrador | `admin` | Full access to all modules and settings |
| Coordinador de Eventos | `coordinator` | Events, quotes, contracts, payments, staff |
| Chef / Compras | `chef` | Requisitions, purchase orders, actual purchases, catalog read |

---

## Status Taxonomy

**Event statuses:** `cotizado` → `contratado` → `en_requisicion` → `en_compras` → `completado` | `cancelado`

**Quote statuses:** `borrador` → `enviada` → `aprobada` | `rechazada`

**Payment statuses:** `pendiente` → `pagado` | `vencido`

**Requisition statuses:** `generada` → `revisada` → `aprobada`

**PO statuses:** `pendiente` → `enviada` → `recibida`
