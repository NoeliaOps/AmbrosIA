# AmbrosIA — Guía de Uso de Marca

> Versión 4.0 · Junio 2026 — Paleta "Pizarra & Champagne"  
> Para equipo de producto, diseño y desarrollo

---

## 1. Filosofía de Diseño

**AmbrosIA es la herramienta de quienes convierten una fecha en un recuerdo.**

La identidad visual es **"Pizarra & Champagne"** — sobria, premium, como el menú de un restaurante Michelin. Sin color dominante saturado; el contenido vive en blanco limpio, el sidebar en pizarra oscura, y el dorado champagne aparece solo en líneas finas y acentos decorativos.

| Valor | Expresión visual |
|-------|-----------------|
| **Elegancia operativa** | Encabezados serif (Playfair Display), espaciado generoso, blanco limpio |
| **Sobriedad premium** | CTAs en carbón oscuro, champagne solo como detalle, nada estridente |
| **Claridad de datos** | Monoespaciado (DM Mono) para números, jerarquía tipográfica estricta |

**Lo que NO somos:** Una herramienta tech genérica. No usamos azules corporativos, fondos negros tipo developer, ni naranjas/ámbar saturados como color de relleno.

---

## 2. Paleta de Colores

### 2.1 Superficies de Contenido

| Token CSS | Valor HEX | Uso |
|-----------|-----------|-----|
| `--background` / `--surface-1` / `--card` | `#FFFFFF` | Fondo de página, tarjetas, modales |
| `--surface-2` | `#F4F4F5` | Inputs, dropdowns — gris muy suave |
| `--surface-3` | `#EBEBEC` | Hover states |

### 2.2 Texto

| Token CSS | Valor HEX | Contraste | Uso |
|-----------|-----------|-----------|-----|
| `--text-1` | `#1A1A1A` | 17:1 sobre blanco | Texto principal, headings |
| `--text-2` | `#4B5563` | 8.2:1 sobre blanco | Texto secundario, subtítulos |
| `--text-3` | `#9CA3AF` | 2.9:1 sobre blanco | Solo placeholders / muted decorativo |

### 2.3 CTA — Carbón Oscuro (color de acción primario)

| Token CSS | Valor HEX | Contraste | Uso |
|-----------|-----------|-----------|-----|
| `--cta` / `--primary` | `#2D2926` | 13.8:1 ✓ AAA | **Botones primarios**, filtros activos, anillo de focus |
| `--cta-hover` | `#1A1714` | — | Hover de botones primarios |

> En clases inline, los botones primarios usan `bg-[#2D2926] hover:bg-[#1A1714] text-white`.

### 2.4 Acento — Champagne Dorado (SOLO decorativo)

| Token CSS | Valor HEX | Contraste | Uso |
|-----------|-----------|-----------|-----|
| `--amber` (`bg-gold`) | `#C4963B` | 2.58:1 ❌ | **Solo decorativo:** líneas, bordes, glows, íconos sobre fondo oscuro |
| `--amber-dim` (`text-gold-dark`) | `#8B6D24` | 4.54:1 ✓ AA | Texto/íconos dorados sobre fondo claro |
| `--amber-bg` | `#FBF6E9` | — | Fondos tint champagne |

> **Regla crítica:** `#C4963B` (champagne) **falla contraste sobre blanco** (2.58:1). Nunca usarlo como color de texto/ícono sobre fondos claros — usar `--amber-dim` `#8B6D24` en su lugar. El champagne es válido sobre el sidebar oscuro y como detalle decorativo (líneas, glows).

### 2.5 Sidebar (pizarra oscuro)

El sidebar usa su propio sistema de tokens que permanece oscuro independientemente del contenido.

| Token CSS | Valor HEX | Uso |
|-----------|-----------|-----|
| `--sidebar` | `#2A2D35` | Fondo del sidebar — gris pizarra azulado |
| `--sidebar-foreground` | `#E8EAF0` | Texto en sidebar |
| `--sidebar-accent` | `#363A46` | Hover items nav |
| `--sidebar-primary` | `#C4963B` | Item activo (champagne, legible sobre pizarra) |

### 2.5 Colores Semánticos

| Token CSS | Valor HEX | Contraste | Uso |
|-----------|-----------|-----------|-----|
| `--status-active` / `--sage` | `#166534` | 7.1:1 ✓ | Contratado, Pagado, Éxito |
| `--status-info` | `#1E40AF` | 8.5:1 ✓ | Cotizado, Enviado, Info |
| `--status-danger` / `--ember` | `#991B1B` | 7.3:1 ✓ | Vencido, Cancelado, Error |
| `--status-done` | `#374151` | 9.1:1 ✓ | Completado, Archivado |

---

## 3. Tipografía

### 3.1 Las tres fuentes — dominios estrictos

| Fuente | Variable CSS | Rol | Dominio |
|--------|-------------|-----|---------|
| **Playfair Display** | `--font-display` | Display serif | SOLO h1 y h2 ≥22px |
| **Karla** | `--font-sans` | Humanist sans | TODO el UI chrome |
| **DM Mono** | `--font-mono` | Monospace | SOLO datos numéricos |

### 3.2 Escala tipográfica

| Uso | Fuente | Tamaño | Peso | Espaciado |
|-----|--------|--------|------|-----------|
| Título de página (h1) | Playfair Display | 28–36px | 600–700 | -0.025em |
| Título de sección (h2) | Playfair Display | 22–26px | 600 | -0.02em |
| Subtítulo / grupo (h3) | Karla | 15–16px | 600 | -0.01em |
| Cuerpo general | Karla | 14px | 400 | normal |
| Labels de UI | Karla | 12–13px | 500 | +0.01em |
| Precios y montos | DM Mono | 14–16px | 500 | -0.01em |
| Status pills y fechas | DM Mono | 11px | 500 | +0.08em |
| Código / IDs | DM Mono | 13px | 400 | normal |

### 3.3 Reglas prohibidas

- ❌ Nunca usar Playfair Display por debajo de 18px
- ❌ Nunca usar Playfair Display para botones, nav items, o texto de tabla
- ❌ Nunca usar DM Mono para texto corrido o encabezados
- ❌ Nunca usar Karla en itálica para encabezados decorativos (ese rol es de Playfair)
- ❌ Nunca mezclar las tres fuentes dentro del mismo bloque de UI

---

## 4. Logo e Identidad

### 4.1 Wordmark

El wordmark **AmbrosIA** tiene tres partes con tratamiento visual diferente:

```
A  [ámbar #B45309, Playfair Display Bold, más grande]
mbros  [texto secundario, Playfair Display Regular, más pequeño]
IA  [ámbar #B45309, Playfair Display Bold, mismo tamaño que "mbros"]
```

**Variantes:**
- `<LogoWordmark variant="dark" />` — texto crema sobre fondo oscuro (sidebar, paneles oscuros)
- `<LogoWordmark variant="light" />` — texto marrón cálido sobre fondo claro

### 4.2 Favicon

Archivo: `/public/brand/ambrosia-favicon.svg`
- "A" en Georgia serif, ámbar `#E8A227` sobre fondo oscuro `#09090C`
- Usar SVG — nunca JPG para favicon

### 4.3 Usos incorrectos del logo

- ❌ No cambiar los colores del wordmark
- ❌ No usar sobre fondos de colores saturados
- ❌ No estirar ni distorsionar las proporciones
- ❌ No usar ninguno de los JPGs del directorio `/public/brand/` directamente en UI (son hojas de especificación, no assets finales)

---

## 5. Componentes de UI

### 5.1 Status Pills

Usar siempre las clases semánticas, nunca colores ad-hoc:

| Estado | Clase | Color texto | Cuándo usar |
|--------|-------|-------------|-------------|
| Borrador | `pill-draft` | Gris | Sin acción aún |
| Activo / Contratado / Pagado | `pill-active` | Verde bosque | Estado positivo confirmado |
| En proceso / Pendiente | `pill-warning` | Ámbar | Requiere atención próxima |
| Error / Vencido / Cancelado | `pill-danger` | Rojo oscuro | Estado negativo urgente |
| Información / Cotizado / Enviado | `pill-info` | Azul marino | Estado neutro informativo |
| Completado / Archivado | `pill-done` | Gris oscuro | Proceso finalizado |

**Uso:**
```tsx
<span className="status-pill pill-active">
  <span className="h-1.5 w-1.5 rounded-full" style={{ background: "currentColor" }} />
  Contratado
</span>
```

### 5.2 Enterprise Cards

```tsx
<div className="enterprise-card p-4">
  {/* contenido */}
</div>
```

- Fondo blanco sobre crema de página = contraste visual sutil y elegante
- Bordes `1px solid var(--border-def)` — siempre cálidos, nunca fríos
- Hover: sombra ligeramente más pronunciada, sin mover el elemento

### 5.3 KPI Tiles

```tsx
<div className="kpi-tile" style={{ borderLeftColor: "var(--amber)" }}>
```

- `borderLeftWidth: 3px` — línea de acento, no borde completo
- El ícono va en un contenedor con `background: var(--amber-glow)` y el ícono en `color: var(--amber)`

### 5.4 Formularios

- Labels: Karla 13px weight 600, color `var(--text-1)`
- Inputs: fondo blanco `#FFFFFF` sobre superficie `#F0EDE5`
- Focus: borde `var(--amber)` + shadow `var(--amber-glow)`
- Nunca placeholder-only (sin label visible)

---

## 6. Página de Login

### Concepto
"La invitación — el primer momento que define la experiencia"

### Layout
- **Panel izquierdo (54%):** Pizarra oscuro `#2A2D35`, brand story, wordmark, tagline en cursiva, glows champagne, features 2×2. Usa `width: 54%` + `flexShrink: 0` (nunca se encoge).
- **Panel derecho (flex-1):** Blanco `#FFFFFF`, formulario sin card. Usa `flex: 1` + `minHeight: 100dvh` (llena todo el alto — evita el "corte").
- **El formulario NO tiene borde ni sombra de card** — respira directamente sobre la superficie
- **CTA "Entrar":** carbón `#2D2926`, hover `#1A1714`, texto blanco

### Tagline oficial del login
> "Para quienes convierten una fecha en un recuerdo."

---

## 7. Iconografía

- Usar **Lucide React** exclusivamente — stroke width consistente de 1.5–2px
- Tamaño base: `size={14}` en nav, `size={16}` en botones, `size={20}` en cards
- Color sobre fondo claro: `var(--text-2)` neutro, o `var(--amber-dim)` `#8B6D24` para acento dorado. Nunca `var(--amber)` (champagne) como ícono sobre blanco.
- **Nunca emojis como íconos funcionales**

---

## 8. Spacing & Layout

| Nivel | Valor | Uso |
|-------|-------|-----|
| XS | 4px | Gap entre elementos inline |
| SM | 8px | Padding interno de badges/pills |
| MD | 16px | Padding interno de cards/tiles |
| LG | 24px | Gap entre secciones dentro de una page |
| XL | 32px | Gap entre secciones principales |
| 2XL | 48px | Separación entre bloques de contenido |

- Espaciado siempre en múltiplos de 4
- Sidebar: `width: 256px` fijo
- Contenido máximo: `max-w-screen-2xl` con `p-4 md:p-8`

---

## 9. Tono y Lenguaje

- **Idioma:** Todo texto de UI en español de México
- **Voz:** Directa, profesional, sin jerga técnica
- **Mensajes de error:** Describen el problema y cómo resolverlo (ej. "El correo no tiene formato válido")
- **Mensajes de éxito:** Breves y confirmatorios (ej. "Ingrediente actualizado")
- **Número de invitados:** "invitados" o "inv." — nunca "comensales" en la UI (reservado para conversación con chef)
- **Moneda:** Siempre `Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })`
- **Fechas:** `dd/MM/yyyy` en listas, texto completo en documentos

---

## 10. Anti-patterns Específicos

| ❌ Prohibido | ✅ Alternativa |
|-------------|---------------|
| Champagne `#C4963B` como texto sobre fondo claro | `#8B6D24` (`text-gold-dark`) para texto/íconos dorados |
| Botones primarios en champagne/dorado | Carbón `#2D2926` con texto blanco |
| Ámbar/naranja saturado como color de relleno | Champagne solo en líneas finas, glows, bordes |
| Tres fuentes mezcladas en un mismo bloque | Una fuente por contexto, regla estricta |
| Status pills con colores inline | Siempre `.pill-*` semánticos |
| Form flotando en card con borde en el login | Form directo sobre superficie sin card |
| Emojis como íconos | Lucide React exclusivamente |
| Colores hardcodeados arbitrarios | CSS variables desde `:root` (excepción: CTA `bg-[#2D2926]`) |
| Playfair Display < 18px | Karla para tamaños pequeños |

---

_Esta guía es un documento vivo. Actualizar con cada decisión de diseño que no esté contemplada aquí._
