# Auditoría de seguridad y rendimiento — AmbrosIA / Artesano

> Fecha: 2026-06-10 · Alcance: infraestructura, base de datos, backend y frontend.
> Proyecto Supabase `qmyiqgvuflbvhkqcdyta` · Deploy Vercel `ambrosia-eta.vercel.app`.

## 1. Resumen ejecutivo

**Postura general: buena base.** RLS activo en todas las tablas, secretos no expuestos al
cliente, validación con Zod, sin sinks de XSS (`dangerouslySetInnerHTML`/`eval`), service-role
solo en el script de seed (nunca en la ruta de petición). Se corrigieron hoy los puntos
sensibles de bajo riesgo; el resto queda en un plan priorizado.

| | Antes | Hoy |
|---|---|---|
| Hallazgos de seguridad (Supabase advisor) | 5 | **1** (ajuste de dashboard) |
| Cabeceras HTTP de seguridad | 0 | **7 + CSP** |
| Funciones `SECURITY DEFINER` expuestas como RPC | 2 | **0** |
| `search_path` mutable en funciones | 2 | **0** |
| FKs sin índice | 14 | **0** |

## 2. Infraestructura, puertos y accesos

Arquitectura **100% gestionada** (sin VMs ni puertos propios que administrar):

| Servicio | Puerto/superficie | Quién lo controla | Postura |
|---|---|---|---|
| App Next.js | 443 (HTTPS) en Vercel | Vercel (TLS automático) | OK · ahora con HSTS |
| Supabase REST/Auth/Realtime | 443 (https) / wss | Supabase | OK · protegido por RLS + anon key |
| Postgres directo | 5432 | Supabase | **Restringir** (ver plan) |
| Pooler (Supavisor) | 6543 | Supabase | Preferir para apps serverless |

**Cambios documentados de acceso aplicados hoy:**
- Cabeceras de seguridad a nivel de borde (`next.config.ts`): CSP, HSTS, `X-Frame-Options: DENY`,
  `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-DNS-Prefetch-Control`,
  y `poweredByHeader: false` (oculta framework/versión).
- Revocado `EXECUTE` público (`anon`/`authenticated`) sobre las funciones de trigger → ya no son
  invocables como RPC vía `/rest/v1/rpc/*`.

**Pendiente de consola (no se puede por código):**
- Supabase → Database → **Network Restrictions**: limitar conexión directa a Postgres (5432) a
  IPs conocidas; el app no la usa (va por REST/pooler).
- Rotar `service_role` y `anon` si alguna vez se compartieron; mantener `service_role` solo en
  variables de entorno de servidor (hoy correcto).

## 3. Hallazgos por capa

### 3.1 Autenticación, usuarios y contraseñas
| # | Hallazgo | Sev. | Estado |
|---|---|---|---|
| A1 | **Roles demo = cookie sin firmar** (`artesano_demo_persona`). Las 5 "personas" comparten **un único usuario y org**; el bloqueo por rol en `proxy.ts` es de navegación, **no** una frontera de autorización (un usuario puede ponerse `ceo` editando la cookie). La protección real de datos es RLS por `org_id`. | Alto (para prod real) | Plan P1 |
| A2 | **Acceso demo público**: cualquier visitante entra con credenciales de servidor y ve datos realistas (nombres/clientes/precios). | Medio | Plan P2 |
| A3 | Protección de **contraseñas filtradas desactivada** (HaveIBeenPwned). Sin política de fuerza ni MFA. | Medio | Plan P2 (dashboard) |
| A4 | Trigger `handle_new_user` ya **no confía** en el rol del cliente (default `coordinator`). | — | ✔ Correcto |

### 3.2 Base de datos / protección de datos (RLS)
| # | Hallazgo | Sev. | Estado |
|---|---|---|---|
| B1 | Funciones `SECURITY DEFINER` con `search_path` mutable + ejecutables por anon. | Alto | ✔ **Corregido** (`20260610000000`) |
| B2 | **Políticas permisivas duplicadas** en 9 catálogos (rol-legacy + org-scoped conviven; se evalúan ambas). | Medio | Plan P3 |
| B3 | `auth.<fn>()` sin envolver en subconsulta en **115 políticas** → re-evaluación por fila. | Bajo (perf) | Plan P4 |
| B4 | RLS activo en **todas** las tablas; service-role nunca en runtime. | — | ✔ Correcto |

### 3.3 Backend (server actions / API)
- ✔ Server Actions devuelven `{ data, error }`, validan con Zod y verifican `getOrgId()`.
- ✔ Rutas PDF (`/api/pdf/*`) exigen sesión (401) y consultan con cliente RLS (sin service-role).
- ⚠️ **C1** Sin rate-limiting propio en login/acciones (se delega en el throttling de Supabase). — Plan P5.
- ⚠️ **C2** Rutas PDF accesibles por cualquier persona autenticada (RLS protege el dato; falta capa de rol). — Plan P3.

### 3.4 Frontend
- ✔ Sin `dangerouslySetInnerHTML`/`eval`; React escapa por defecto; sin secretos `NEXT_PUBLIC_*`
  sensibles (solo URL + anon key, que son públicas por diseño).
- ✔ `.env*` en `.gitignore`; campos de contraseña con `autoComplete` correcto y toggle ver/ocultar.
- ⚠️ **D1** CSP usa `'unsafe-inline'` en scripts (necesario sin nonces en Next 16). — Plan P5 (endurecer con nonce).

## 4. Cambios aplicados hoy (verificados: tsc/build/lint ✔)

| Cambio | Archivo / migración | Efecto |
|---|---|---|
| Endurecer funciones | `supabase/migrations/20260610000000_harden_functions.sql` | `search_path=''`, esquema calificado, `revoke execute`. Cierra 4/5 advisors. |
| Índices de FK | `…20260610000100_fk_covering_indexes.sql` | 14 índices; acelera joins y DELETE en padres. |
| Cabeceras de seguridad | `next.config.ts` | CSP + HSTS + anti-clickjacking + anti-sniff + Permissions-Policy. |

## 5. Plan de remediación (de lo más sensible a lo menos)

| P | Acción | Capa | Esfuerzo | Cómo |
|---|---|---|---|---|
| **P1** | **RBAC real por usuario** (reemplazar cookie-persona): columna `role` real, claim en JWT y políticas RLS por rol además de `org_id`. Migrar `handle_new_user` y el `enum user_role` a los 5 roles. | Auth/DB | Alto | Migración + `app_metadata` por usuario + revisar `proxy.ts`/`access.ts`. |
| **P2** | Activar **leaked-password protection**, mínimos de fuerza y **MFA** para CEO/Gerente. Cerrar o anonimizar el demo público. | Auth | Bajo | Dashboard Supabase → Auth → Password/MFA. Datos demo ofuscados. |
| **P3** | Consolidar **políticas RLS duplicadas** (eliminar las rol-legacy en los 9 catálogos, dejar org-scoped) y añadir verificación de rol a `/api/pdf/*`. | DB/Backend | Medio | Migración `drop policy` + chequeo de persona en la ruta. |
| **P4** | Optimizar **115 políticas**: `auth.uid()` → `(select auth.uid())`. | DB | Medio | Migración mecánica `alter policy`; aplicar y re-correr advisor. |
| **P5** | Rate-limit en login/acciones sensibles; endurecer CSP con **nonces**; activar Network Restrictions en Postgres. | Backend/Infra | Medio | Upstash/Vercel KV o middleware; nonce en `proxy.ts`. |

> Patrón para P4 (referencia): `using (org_id = (select org_id from public.profiles where id = (select auth.uid())))`.

## 6. Análisis de rendimiento

**Estado a escala demo (decenas de filas): sin impacto real.** Las advertencias son preventivas
"a escala". Hallazgos del advisor de rendimiento (206 lints):

| Tipo | Conteo | Acción |
|---|---|---|
| `unindexed_foreign_keys` | 14 | ✔ **Resuelto hoy** (migración FK). |
| `auth_rls_initplan` (re-evaluación por fila) | 115 | Plan **P4** (mecánico, alto impacto a escala). |
| `multiple_permissive_policies` | 36 | Plan **P3** (consolidar reduce evaluaciones por query). |
| `unused_index` | 41 | **Sin acción**: normal en base nueva; revisar tras 1-2 meses de uso real antes de eliminar. |

**Observaciones de código (frontend/SSR):**
- Dashboard y Utilidad hacen agregaciones en memoria sobre pocos registros → OK. A escala (miles
  de eventos) mover sumas a vistas/RPC en Postgres.
- Páginas server-component con `Promise.all` para consultas paralelas → buen patrón ya presente.
- Tablas grandes (kardex, utilidad) ya paginadas/limitadas (`.limit(300)`, `PAGE_SIZE`).

## 7. Recomendaciones de mantenimiento

| Cadencia | Tarea |
|---|---|
| **Cada release / cambio de schema** | `npm run build && npm run typecheck && npm run lint`; correr `get_advisors` (security+performance) tras DDL. |
| **Mensual** | `npm audit` / actualizar dependencias menores; revisar `unused_index` con datos reales. |
| **Trimestral** | Rotar `anon`/`service_role` y secretos; revisar usuarios/roles activos; validar backups (PITR de Supabase) con una restauración de prueba. |
| **Continuo** | Mantener captura por dropdowns (catálogos canónicos); nunca introducir service-role en rutas de petición; toda tabla nueva con RLS org-scoped + advisor verde antes de pushear. |

---
**Apéndice — verificación post-cambios:** advisor de seguridad pasó de 5 → 1 (solo el ajuste de
dashboard de contraseñas filtradas). Build, typecheck y lint en verde. Migraciones aplicadas al
remoto; pendientes de `git push` junto con el resto del working tree.
