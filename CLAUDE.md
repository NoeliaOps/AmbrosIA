# CLAUDE.md — Artesano Banquetes Project Conventions

## Commands

```bash
# Development
npm run dev          # Start Next.js dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint check
npm run typecheck    # tsc --noEmit

# Supabase (run from project root, requires Supabase CLI)
supabase db push     # Apply pending migrations to remote
supabase db reset    # Reset local DB and re-run all migrations + seed
supabase gen types   # Regenerate TypeScript types from schema

# Seed data
npm run db:seed      # Run the seed script against the configured Supabase project
```

## Project Structure

```
artesano/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Auth group: login, forgot-password
│   ├── (dashboard)/            # Protected shell with sidebar layout
│   │   ├── layout.tsx          # Sidebar + header shell
│   │   ├── page.tsx            # Dashboard home
│   │   ├── eventos/            # Events module
│   │   ├── catalogos/          # Master catalogs
│   │   │   ├── ingredientes/
│   │   │   ├── platillos/
│   │   │   ├── menus/
│   │   │   ├── proveedores/
│   │   │   ├── personal/
│   │   │   └── costos-indirectos/
│   │   ├── cotizaciones/       # Quotes (often accessed via event)
│   │   ├── contratos/          # Contracts
│   │   ├── pagos/              # Payment schedules
│   │   ├── requisiciones/      # Requisitions
│   │   ├── ordenes-compra/     # Purchase orders
│   │   ├── compras-reales/     # Actual purchases
│   │   ├── utilidad/           # Profit analysis
│   │   ├── personal-eventos/   # Staff assignments
│   │   └── configuracion/      # Settings + module flags
│   ├── api/                    # API routes (webhooks, PDF generation)
│   └── globals.css             # CSS variables + Tailwind base
├── components/
│   ├── ui/                     # shadcn/ui base components (adapted to brand)
│   ├── layout/                 # Sidebar, Header, PageHeader, Breadcrumb
│   ├── forms/                  # Reusable form components
│   ├── tables/                 # DataTable, columns, filters
│   ├── charts/                 # Recharts wrappers
│   └── pdf/                    # PDF templates (quotes, contracts)
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser Supabase client
│   │   ├── server.ts           # Server Supabase client (cookies)
│   │   └── types.ts            # Generated types (supabase gen types)
│   ├── modules.ts              # Central module registry
│   ├── utils.ts                # Shared helpers (formatCurrency, formatDate, etc.)
│   └── constants.ts            # App-wide constants
├── hooks/                      # Custom React hooks
├── supabase/
│   ├── migrations/             # Versioned SQL migrations (001_, 002_, ...)
│   └── seed.sql                # Seed data script
├── public/
│   └── brand/                  # Logo files, brand assets
├── .env.local                  # Local env vars (never commit)
├── .env.example                # Documented env var template
├── PLAN.md                     # Phase breakdown and architecture
├── CLAUDE.md                   # This file
└── README.md                   # Install, deploy, DNS instructions
```

## Coding Conventions

### TypeScript
- Strict mode enabled (`"strict": true` in tsconfig)
- No `any` — use `unknown` + type guards if necessary
- All Supabase query results typed via generated types
- Prefer `type` over `interface` for data shapes; use `interface` only for extensible objects

### Naming
- Files: `kebab-case.tsx`
- Components: `PascalCase`
- Functions / variables: `camelCase`
- Database tables/columns: `snake_case`
- URL segments: `/kebab-case`

### Components
- Server Components by default; add `'use client'` only when needed (event handlers, hooks, browser APIs)
- Forms use React Hook Form + Zod validation
- Data fetching in Server Components via Supabase server client
- Mutations via Server Actions (preferred) or API routes

### Tailwind / Styling
- Use brand CSS variables via Tailwind `var()` utilities
- No inline styles except for truly dynamic values
- Component variants via `cva` (class-variance-authority)

### Supabase
- Always apply RLS policies in migrations, never skip them
- Use `createServerClient` (from `@supabase/ssr`) in server context, `createBrowserClient` in client context
- All tables include `org_id uuid references organizations(id)` for multi-tenant readiness
- Migration files: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`

### Error Handling
- Server Actions return `{ data, error }` objects — never throw from actions
- Use `toast` (sonner) for user-facing success/error messages
- Error boundaries wrap each major page section

## Brand / UI Rules

- **Language:** All user-facing strings in Spanish (Mexico). Codebase, comments, and variable names in English.
- **Currency:** Always format as MXN with `Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })`
- **Dates:** Format with `Intl.DateTimeFormat('es-MX', { dateStyle: 'long' })` or `dd/MM/yyyy`
- **Background:** `--color-cream` (#F3F0E9) as page background
- **Accent:** `--color-gold` (#C6A56B) for primary CTAs and active states
- **Text:** `--color-black` (#0F0F0F) primary, `--color-dark` (#3C3C3C) secondary
- **Headings:** Playfair Display font
- **Body:** Cormorant Garamond font; Inter for dense UI (tables, forms)
- **Status badges:** color-coded consistently (see taxonomy in PLAN.md)

## Module System

Modules are toggled via `module_settings` table (one row per module per org). The central registry is in `lib/modules.ts`:

```ts
// lib/modules.ts
export const MODULE_REGISTRY = {
  quotes: { label: 'Cotizaciones', path: '/cotizaciones', icon: FileText },
  // ...
} as const

export type ModuleKey = keyof typeof MODULE_REGISTRY
```

Check `useModules()` hook before rendering module-specific nav items or pages.

## Environment Variables

Required in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server-side only, never expose to client
```

## Commit Convention

```
feat(module): short description
fix(module): short description
chore: short description
```

Examples: `feat(quotes): add PDF export`, `fix(requisitions): correct recipe explosion formula`

## Phase Completion Checklist

Before declaring a phase complete:
- [ ] `npm run build` passes with no errors
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] All new pages have loading state (Suspense / skeleton)
- [ ] All new pages have empty state with CTA
- [ ] All forms have validation with Spanish error messages
- [ ] New tables have corresponding Supabase migration file
- [ ] RLS policies added for all new tables
- [ ] Committed with descriptive message
