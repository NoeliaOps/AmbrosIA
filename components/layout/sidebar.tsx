"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { ChevronDown, LogOut, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { MODULE_REGISTRY, RECIPES_NAV, CATALOG_SECONDARY_NAV, type ModuleKey } from "@/lib/modules"
import { LogoWordmark } from "@/components/ui/logo"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { Tables } from "@/lib/supabase/types"
import { DEMO_PERSONAS, PERSONA_ORDER, type DemoPersona } from "@/lib/demo"
import { setDemoPersona } from "@/app/actions/set-demo-persona"

type Profile = Pick<Tables<"profiles">, "full_name" | "email" | "role">
type SidebarProps = {
  profile: Profile | null
  enabledModules: Set<ModuleKey>
  demoPersona: DemoPersona
}

// Segmentos del menú lateral. Cada segmento se muestra solo si el rol tiene al
// menos un módulo visible en él. Dashboard va arriba sin encabezado.
const NAV_SEGMENTS: { label: string | null; keys: ModuleKey[] }[] = [
  { label: null,        keys: ["dashboard"] },
  { label: "Agenda",    keys: ["calendar"] },
  { label: "Operación", keys: ["events", "staff", "postmortem"] },
  { label: "Comercial", keys: ["quotes", "contracts", "templates"] },
  { label: "Finanzas",  keys: ["payments", "profit"] },
  { label: "Abasto",    keys: ["requisitions", "purchase_orders", "actual_purchases", "inventory"] },
]

export function Sidebar({ enabledModules, demoPersona }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [catalogOpen, setCatalogOpen] = useState(pathname.startsWith("/catalogos"))
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [, startTransition] = useTransition()

  const persona = DEMO_PERSONAS[demoPersona]

  function isActive(path: string) {
    if (path === "/") return pathname === "/"
    return pathname.startsWith(path)
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    document.cookie = "artesano_demo_persona=; path=/; max-age=0"
    toast.success("Sesión cerrada")
    router.push("/login")
    router.refresh()
  }

  function switchPersona(p: DemoPersona) {
    setSwitcherOpen(false)
    startTransition(() => { setDemoPersona(p) })
  }

  const canSee = (key: ModuleKey) =>
    (key === "dashboard" || enabledModules.has(key)) && persona.allowedModules.includes(key)

  const visibleSegments = NAV_SEGMENTS
    .map((seg) => ({ label: seg.label, keys: seg.keys.filter(canSee) }))
    .filter((seg) => seg.keys.length > 0)

  const filteredRecipes = persona.showCatalogs
    ? persona.catalogPaths
      ? RECIPES_NAV.filter((item) => persona.catalogPaths!.includes(item.path))
      : RECIPES_NAV
    : []

  const filteredCatalogs = persona.showCatalogs
    ? persona.catalogPaths
      ? CATALOG_SECONDARY_NAV.filter((item) => persona.catalogPaths!.includes(item.path))
      : CATALOG_SECONDARY_NAV
    : []

  return (
    <aside className="flex h-full w-64 flex-col border-r border-sidebar-border"
      style={{ background: "var(--sidebar)" }}>

      {/* ── Logo mark ─────────────────────────────── */}
      <div className="flex h-14 items-center px-4 border-b border-sidebar-border">
        <LogoWordmark size="md" />
      </div>

      {/* ── Demo persona switcher ─────────────────── */}
      <div className="px-4 pt-3 pb-2 border-b border-sidebar-border/40">
        <button
          onClick={() => setSwitcherOpen((v) => !v)}
          className="w-full flex items-center gap-2.5 rounded px-1.5 py-1 hover:bg-sidebar-accent/70 transition-colors duration-150"
        >
          {/* Initials stamp */}
          <div
            className={cn("h-7 w-7 rounded-sm flex items-center justify-center text-[10px] font-bold shrink-0", persona.color)}
            style={{ fontFamily: "var(--font-inter)", letterSpacing: "0.04em" }}
          >
            {persona.initials}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p style={{
              fontFamily: "var(--font-cormorant), Georgia, serif",
              fontSize: "0.9rem",
              fontWeight: 500,
              color: "rgb(232 226 216 / 0.9)",
              lineHeight: 1.3,
              letterSpacing: "0.01em",
            }} className="truncate">{persona.name}</p>
            <p style={{
              fontFamily: "var(--font-inter)",
              fontSize: "0.6rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "rgb(232 226 216 / 0.35)",
            }} className="truncate">{persona.title}</p>
          </div>
          <ChevronDown size={11}
            className={cn("shrink-0 transition-transform duration-200", switcherOpen && "rotate-180")}
            style={{ color: "rgb(232 226 216 / 0.3)" }} />
        </button>

        <div className="nav-dropdown" data-open={switcherOpen ? "true" : "false"}>
          <div>
            <div className="mt-1.5 space-y-0.5 pb-1">
              {/* Annotation divider */}
              <div className="flex items-center gap-2 px-1.5 py-1">
                <div className="flex-1 h-px" style={{ background: "rgb(232 226 216 / 0.12)" }} />
                <span style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: "0.55rem",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "rgb(232 226 216 / 0.25)",
                }}>cambiar vista</span>
                <div className="flex-1 h-px" style={{ background: "rgb(232 226 216 / 0.12)" }} />
              </div>
              {PERSONA_ORDER.map((key) => {
                const p = DEMO_PERSONAS[key]
                const active = key === demoPersona
                return (
                  <button
                    key={key}
                    onClick={() => switchPersona(key)}
                    className={cn(
                      "w-full flex items-center gap-2 rounded px-1.5 py-1.5 text-left transition-colors duration-150",
                      active
                        ? "bg-sidebar-accent"
                        : "hover:bg-sidebar-accent/50"
                    )}
                  >
                    <div className={cn("h-5 w-5 rounded-sm flex items-center justify-center text-[9px] font-bold shrink-0", p.color)}>
                      {p.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{
                        fontFamily: "var(--font-sans), system-ui, sans-serif",
                        fontSize: "0.8rem",
                        fontWeight: active ? 600 : 400,
                        color: active ? "var(--amber)" : "rgb(240 235 226 / 0.6)",
                        letterSpacing: "0.01em",
                      }} className="truncate">{p.name}</p>
                    </div>
                    {active && (
                      <span style={{ color: "var(--amber)", fontSize: "0.65rem", opacity: 0.7 }}>✓</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation ────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {visibleSegments.map((seg, i) => (
          <div key={seg.label ?? "inicio"} className={i > 0 ? "pt-3" : ""}>
            {seg.label && <SectionDivider label={seg.label} />}
            {seg.keys.map((key) => {
              const mod = MODULE_REGISTRY[key]
              return (
                <NavItem
                  key={key}
                  href={mod.path}
                  icon={<mod.icon size={14} />}
                  label={mod.label}
                  active={isActive(mod.path)}
                />
              )
            })}
          </div>
        ))}

        {/* ── Recetas section — hero ────────────── */}
        {filteredRecipes.length > 0 && (
          <div className="pt-3">
            <SectionDivider label="recetas" />
            {filteredRecipes.map((item) => (
              <NavItem
                key={item.path}
                href={item.path}
                icon={<item.icon size={14} />}
                label={item.label}
                active={isActive(item.path)}
              />
            ))}
          </div>
        )}

        {/* ── Catálogos secundarios ─────────────── */}
        {filteredCatalogs.length > 0 && (
          <div className="pt-3">
            <button
              onClick={() => setCatalogOpen((v) => !v)}
              className={cn(
                "relative flex w-full items-center justify-between rounded px-3 py-1.5 transition-colors duration-150",
                catalogOpen
                  ? "text-sidebar-foreground/70"
                  : "text-sidebar-foreground/35 hover:text-sidebar-foreground/60"
              )}
            >
              <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.75rem", letterSpacing: "0.01em" }}>
                Catálogos
              </span>
              <ChevronDown
                size={11}
                className="transition-transform duration-200"
                style={{
                  transform: catalogOpen ? "rotate(0deg)" : "rotate(-90deg)",
                  transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
                }}
              />
            </button>

            <div className="nav-dropdown" data-open={catalogOpen ? "true" : "false"}>
              <div>
                <div className="mt-0.5 ml-3 pl-3 border-l space-y-0.5"
                  style={{ borderColor: "rgb(240 235 226 / 0.08)" }}>
                  {filteredCatalogs.map((item) => (
                    <NavItem
                      key={item.path}
                      href={item.path}
                      icon={<item.icon size={12} />}
                      label={item.label}
                      active={isActive(item.path)}
                      small
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ── Footer ───────────────────────────────── */}
      <div className="border-t border-sidebar-border/40 p-3 space-y-1">
        {persona.showSettings && (
          <NavItem
            href="/configuracion"
            icon={<Settings size={14} />}
            label="Configuración"
            active={isActive("/configuracion")}
          />
        )}

        {/* User — persona activa */}
        <div className="flex items-center gap-2.5 px-3 py-2.5 mt-1"
          style={{ borderTop: "1px dashed rgb(232 226 216 / 0.1)" }}>
          <div className={cn("h-7 w-7 rounded-sm flex items-center justify-center shrink-0 text-xs font-bold", persona.color)}
            style={{ fontFamily: "var(--font-inter)", fontSize: "0.7rem", letterSpacing: "0.04em" }}>
            {persona.initials}
          </div>
          <div className="flex-1 min-w-0">
            <p style={{
              fontFamily: "var(--font-sans), system-ui, sans-serif",
              fontSize: "0.8125rem",
              fontWeight: 500,
              color: "rgb(240 235 226 / 0.8)",
              letterSpacing: "0.01em",
              lineHeight: 1.3,
            }} className="truncate">
              {persona.name}
            </p>
            <p style={{
              fontFamily: "var(--font-mono), ui-monospace, monospace",
              fontSize: "0.58rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "rgb(240 235 226 / 0.28)",
            }} className="truncate">
              {persona.title}
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger
              onClick={handleSignOut}
              className="cursor-pointer bg-transparent border-none p-0.5 rounded transition-colors duration-150"
              style={{ color: "rgb(232 226 216 / 0.25)" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "rgb(232 226 216 / 0.7)"}
              onMouseLeave={(e) => e.currentTarget.style.color = "rgb(232 226 216 / 0.25)"}
            >
              <LogOut size={13} />
            </TooltipTrigger>
            <TooltipContent side="right">Cerrar sesión</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </aside>
  )
}

type NavItemProps = {
  href: string
  icon: React.ReactNode
  label: string
  active: boolean
  small?: boolean
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 px-2 mb-1.5">
      <div className="flex-1 h-px" style={{ background: "rgb(240 235 226 / 0.08)" }} />
      <span style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.52rem",
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color: "var(--amber)",
        opacity: 0.6,
      }}>{label}</span>
      <div className="flex-1 h-px" style={{ background: "rgb(240 235 226 / 0.08)" }} />
    </div>
  )
}

function NavItem({ href, icon, label, active, small }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "relative flex items-center gap-2.5 rounded px-3 py-1.5 transition-all duration-150",
        small ? "py-1" : "py-1.5",
        active
          ? "text-gold"
          : "hover:bg-sidebar-accent/40"
      )}
    >
      {/* Left indicator — bookmark needle */}
      <span className={cn(
        "absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full transition-all duration-200",
        active ? "opacity-100 h-4 w-0.5" : "opacity-0 h-2 w-0.5",
      )} style={{ background: active ? "var(--amber)" : "transparent" }} />

      {/* Icon */}
      <span style={{
        color: active ? "var(--amber)" : "rgb(240 235 226 / 0.38)",
        transition: "color 150ms ease",
      }}>
        {icon}
      </span>

      {/* Label */}
      <span style={{
        fontFamily: "var(--font-sans), system-ui, sans-serif",
        fontSize: small ? "0.75rem" : "0.8125rem",
        fontWeight: active ? 500 : 400,
        color: active ? "var(--amber)" : "rgb(240 235 226 / 0.52)",
        letterSpacing: "0.01em",
        transition: "color 150ms ease",
      }}>
        {label}
      </span>
    </Link>
  )
}
