# AmbrosIA — Plataforma de Gestión para Banquetes

SaaS de gestión interna para empresas de banquetes y catering. Cotizaciones, contratos, requisiciones, control de compras, pagos y utilidad real por evento.

**Demo:** [ambrosia-eta.vercel.app](https://ambrosia-eta.vercel.app)

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript 5 strict |
| Estilos | Tailwind CSS 4 · CSS variables |
| Componentes | shadcn/ui |
| Base de datos | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth |
| Tipografía | Fraunces · Instrument Sans · DM Mono |
| Forms | React Hook Form + Zod |
| PDF | @react-pdf/renderer |
| Email | Resend |
| Hosting | Vercel |

---

## Módulos

| Módulo | Descripción |
|---|---|
| Dashboard | KPIs, alertas y resumen ejecutivo |
| Calendario | Vista mensual con links a Google Calendar |
| Eventos | Ciclo de vida completo por evento |
| Cotizaciones | Generación y PDF automático |
| Contratos | Firma y envío por email |
| Pagos | Calendario de cobros |
| Requisiciones | Explosión de recetas |
| Órdenes de compra | Por proveedor y fecha |
| Compras reales | Real vs. estimado |
| Utilidad real | Estado de resultados por evento |
| Personal | Asignación y costo por evento |

---

## Instalación local

### Requisitos

- Node.js 18+
- Cuenta en [Supabase](https://supabase.com)

### 1. Clonar e instalar

```bash
git clone https://github.com/NoeliaOps/AmbrosIA.git
cd AmbrosIA
npm install
```

### 2. Variables de entorno

```bash
cp .env.example .env.local
```

| Variable | Dónde encontrarla |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role |

### 3. Aplicar migraciones

```bash
supabase link --project-ref <tu-project-ref>
supabase db push
```

O ejecuta `supabase/migrations/` directamente en el SQL Editor de Supabase.

### 4. Datos de demo

```bash
npm run db:seed
```

### 5. Levantar servidor

```bash
npm run dev
# http://localhost:3000
```

---

## Scripts

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run lint         # ESLint
npm run typecheck    # TypeScript noEmit
npm run db:seed      # Seed datos demo
npm run db:types     # Regenerar tipos Supabase
```

---

## Despliegue en Vercel

1. Importa el repositorio en [vercel.com](https://vercel.com)
2. Agrega las variables de entorno en **Settings → Environment Variables**
3. Vercel detecta Next.js automáticamente — deploy en un clic

---

## Estructura

```
├── app/
│   ├── (auth)/            # Login
│   ├── (dashboard)/       # Shell con sidebar
│   └── api/               # PDF, webhooks
├── components/
│   ├── ui/                # shadcn/ui + LogoWordmark
│   ├── layout/            # Sidebar, PageHeader, MobileNav
│   └── pdf/               # Templates de cotización y contrato
├── lib/
│   ├── supabase/          # Cliente browser/server + tipos
│   ├── modules.ts         # Registro de módulos
│   └── utils.ts           # formatCurrency, formatDate, googleCalendarEventUrl
├── hooks/
├── supabase/
│   └── migrations/        # SQL versionado
└── public/brand/          # Logo SVG, favicon
```
