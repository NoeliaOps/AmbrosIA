# Artesano Banquetes — Sistema de Gestión Interna

MVP de software de gestión para la empresa de banquetes Artesano. Construido con Next.js 16, Supabase y Tailwind CSS 4.

---

## Instalación local

### Requisitos

- Node.js 18+
- npm 9+
- Cuenta en [Supabase](https://supabase.com)
- (Opcional) [Supabase CLI](https://supabase.com/docs/guides/cli) para migraciones locales

### 1. Clonar y dependencias

```bash
git clone <repo-url>
cd artesano
npm install
```

### 2. Variables de entorno

```bash
cp .env.example .env.local
```

Edita `.env.local` con los valores de tu proyecto Supabase:

| Variable | Dónde encontrarla |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Dashboard → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Dashboard → Settings → API → service_role |

### 3. Base de datos — aplicar migraciones

Con Supabase CLI:

```bash
supabase login
supabase link --project-ref <tu-project-ref>
supabase db push
```

O copia el contenido de `supabase/migrations/` y ejecútalo en el SQL Editor de tu proyecto.

### 4. Usuario administrador

En Supabase Dashboard → Authentication → Users, crea el usuario:

- **Email:** `admin@artesano.mx`
- **Password:** `ArtesanoDemo2024!`
- **Confirmar email:** activado

Luego actualiza el perfil:

```sql
update profiles
set role = 'admin', full_name = 'Administrador Artesano'
where email = 'admin@artesano.mx';
```

### 5. Servidor de desarrollo

```bash
npm run dev
# http://localhost:3000
```

---

## Scripts disponibles

```bash
npm run dev        # Servidor de desarrollo
npm run build      # Build de producción
npm run start      # Servidor de producción
npm run lint       # Linter ESLint
npm run typecheck  # Verificación TypeScript
npm run db:seed    # Datos de demostración (Fase 7)
npm run db:types   # Regenerar tipos desde Supabase
```

---

## Despliegue en Vercel

### 1. Crear proyecto

1. En [vercel.com](https://vercel.com), crea un proyecto importando el repositorio.
2. Vercel detecta Next.js automáticamente.

### 2. Variables de entorno en Vercel

Proyecto → **Settings → Environment Variables**:

```
NEXT_PUBLIC_SUPABASE_URL       → Production + Preview + Development
NEXT_PUBLIC_SUPABASE_ANON_KEY  → Production + Preview + Development
SUPABASE_SERVICE_ROLE_KEY      → Production + Preview únicamente (nunca client-side)
```

### 3. Dominio personalizado — Hostinger → Vercel

**En Vercel:** Proyecto → Settings → Domains → agrega `app.tudominio.com`.  
Copia el valor CNAME que Vercel te proporciona (ej. `cname.vercel-dns.com`).

**En Hostinger:** Panel → Dominios → Administrar DNS → Nuevo registro:

| Tipo | Nombre | Valor |
|---|---|---|
| CNAME | `app` | `cname.vercel-dns.com` |

TTL: 3600. Propagación: 15 min – 48 h. Vercel provisiona SSL automáticamente.

---

## Credenciales del demo

| Campo | Valor |
|---|---|
| Email | `admin@artesano.mx` |
| Contraseña | `ArtesanoDemo2024!` |

---

## Estructura del proyecto

```
artesano/
├── app/
│   ├── (auth)/            # Login
│   ├── (dashboard)/       # Shell protegida con sidebar
│   └── api/               # API routes (PDF, webhooks)
├── components/
│   ├── ui/                # shadcn/ui adaptado a la marca
│   └── layout/            # Sidebar, PageHeader
├── lib/
│   ├── supabase/          # Clientes y tipos
│   ├── modules.ts         # Registro de módulos
│   ├── utils.ts           # Helpers de formato
│   └── constants.ts       # Constantes globales
├── hooks/
├── supabase/
│   └── migrations/        # SQL versionado
└── README.md
```

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript 5 strict |
| Estilos | Tailwind CSS 4 + CSS variables |
| Componentes | shadcn/ui (New York) |
| Base de datos | Supabase (PostgreSQL 17 + RLS) |
| Auth | Supabase Auth |
| Fuentes | Playfair Display · Cormorant Garamond · Inter |
| Forms | React Hook Form + Zod |
| Notificaciones | Sonner |
| Hosting | Vercel + Hostinger DNS |
