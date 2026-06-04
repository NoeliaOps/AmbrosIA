"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DEMO_PERSONAS, type DemoPersona } from "@/lib/demo"
import { enterDemo } from "@/app/actions/demo-login"

const loginSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
})
type LoginForm = z.infer<typeof loginSchema>
const PERSONA_ORDER: DemoPersona[] = ["admin", "coordinadora", "chef"]

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState<DemoPersona | null>(null)
  const [showPass, setShowPass] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginForm) {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password })
    if (error) {
      toast.error(error.message === "Invalid login credentials" ? "Correo o contraseña incorrectos" : "Error al iniciar sesión.")
      setLoading(false)
      return
    }
    router.push("/")
    router.refresh()
  }

  async function handleEnterDemo(persona: DemoPersona) {
    setDemoLoading(persona)
    const result = await enterDemo(persona)
    if (result?.error) { toast.error(result.error); setDemoLoading(null) }
  }

  const year = new Date().getFullYear()
  const busy = loading || !!demoLoading

  return (
    <div className="h-dvh flex overflow-hidden">

      {/* ══════════════════════════════════════════════════════
          PANEL IZQUIERDO — Brand editorial (oscuro cálido)
          Visible solo en pantallas grandes
          ══════════════════════════════════════════════════════ */}
      <div
        className="hidden lg:flex lg:w-[52%] xl:w-[54%] flex-col relative overflow-hidden"
        style={{ background: "#1C1612" }}
      >
        {/* Textura de fondo — patrón líneas diagonales muy sutil */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 40px,
            rgb(255 240 210 / 0.015) 40px,
            rgb(255 240 210 / 0.015) 41px
          )`,
        }} />

        {/* Círculos de acento — evocan candelas, mesas, elegancia */}
        <div className="absolute pointer-events-none" style={{
          top: "-10%", right: "-8%",
          width: "520px", height: "520px",
          background: "radial-gradient(ellipse at center, rgb(180 83 9 / 0.18) 0%, transparent 65%)",
          borderRadius: "50%",
        }} />
        <div className="absolute pointer-events-none" style={{
          bottom: "5%", left: "-12%",
          width: "400px", height: "400px",
          background: "radial-gradient(ellipse at center, rgb(180 83 9 / 0.10) 0%, transparent 65%)",
          borderRadius: "50%",
        }} />

        {/* Grain sutil */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          opacity: 0.04, mixBlendMode: "screen",
        }} />

        {/* Contenido del panel */}
        <div className="relative z-10 flex flex-col h-full px-14 xl:px-18 py-12">

          {/* Wordmark — AmbrosIA */}
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.04em", userSelect: "none" }}>
            <span style={{
              fontFamily: "var(--font-display), 'Playfair Display', Georgia, serif",
              fontSize: "1.5rem", fontWeight: 700,
              color: "#B45309",
              letterSpacing: "-0.02em",
            }}>A</span>
            <span style={{
              fontFamily: "var(--font-display), 'Playfair Display', Georgia, serif",
              fontSize: "1rem", fontWeight: 400,
              color: "rgb(232 224 212 / 0.7)",
              letterSpacing: "0.04em",
            }}>mbros</span>
            <span style={{
              fontFamily: "var(--font-display), 'Playfair Display', Georgia, serif",
              fontSize: "1rem", fontWeight: 700,
              color: "#B45309",
              letterSpacing: "0.04em",
            }}>IA</span>
          </div>

          {/* Hero — tipografía editorial */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: "420px" }}>

            {/* Eyebrow */}
            <p style={{
              fontFamily: "var(--font-sans), 'Karla', system-ui, sans-serif",
              fontSize: "0.6875rem", fontWeight: 500,
              letterSpacing: "0.2em", textTransform: "uppercase",
              color: "#B45309",
              marginBottom: "1.25rem",
            }}>
              Gestión de banquetes
            </p>

            {/* Titular */}
            <h1 style={{
              fontFamily: "var(--font-display), 'Playfair Display', Georgia, serif",
              fontSize: "clamp(2.25rem, 3.5vw, 3.25rem)",
              fontWeight: 700,
              color: "#F0EBE0",
              lineHeight: 1.1,
              letterSpacing: "-0.025em",
              marginBottom: "1.5rem",
            }}>
              Para quienes<br />
              convierten una fecha<br />
              <em style={{ color: "#B45309", fontStyle: "italic" }}>en un recuerdo.</em>
            </h1>

            {/* Descripción */}
            <p style={{
              fontFamily: "var(--font-sans), 'Karla', system-ui, sans-serif",
              fontSize: "0.9375rem",
              color: "rgb(232 224 212 / 0.55)",
              lineHeight: 1.7,
              maxWidth: "360px",
              marginBottom: "2.5rem",
            }}>
              Control de recetas, costos y eventos en una sola herramienta.
            </p>

            {/* Feature grid — 2×2 */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
            }}>
              {[
                ["Recetas & costos", "Control exacto de ingredientes"],
                ["Cotizaciones PDF", "Listas en segundos"],
                ["Calendario",       "Todos los eventos a la vista"],
                ["Utilidad real",    "Saber qué deja cada evento"],
              ].map(([title, sub]) => (
                <div key={title} style={{
                  borderLeft: "2px solid rgb(180 83 9 / 0.35)",
                  paddingLeft: "0.75rem",
                }}>
                  <p style={{
                    fontFamily: "var(--font-sans), 'Karla', system-ui, sans-serif",
                    fontSize: "0.8rem", fontWeight: 600,
                    color: "rgb(232 224 212 / 0.85)",
                    lineHeight: 1.3,
                  }}>{title}</p>
                  <p style={{
                    fontFamily: "var(--font-sans), 'Karla', system-ui, sans-serif",
                    fontSize: "0.7rem",
                    color: "rgb(232 224 212 / 0.4)",
                    marginTop: "0.15rem",
                  }}>{sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p style={{
            fontFamily: "var(--font-mono), 'DM Mono', ui-monospace, monospace",
            fontSize: "0.6rem", letterSpacing: "0.12em",
            color: "rgb(232 224 212 / 0.2)",
          }}>
            © {year} AmbrosIA
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          PANEL DERECHO — Formulario limpio, sin card
          ══════════════════════════════════════════════════════ */}
      <div
        className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-20 overflow-y-auto"
        style={{ background: "#FAF8F5" }}
      >
        {/* Logo móvil — solo en pantallas pequeñas */}
        <div className="lg:hidden mb-10">
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.04em" }}>
            <span style={{
              fontFamily: "var(--font-display), Georgia, serif",
              fontSize: "1.375rem", fontWeight: 700, color: "#B45309",
            }}>A</span>
            <span style={{
              fontFamily: "var(--font-display), Georgia, serif",
              fontSize: "0.9rem", fontWeight: 400,
              color: "#6B5E54",
            }}>mbros</span>
            <span style={{
              fontFamily: "var(--font-display), Georgia, serif",
              fontSize: "0.9rem", fontWeight: 700, color: "#B45309",
            }}>IA</span>
          </div>
        </div>

        <div className="w-full max-w-sm">

          {/* Encabezado del formulario */}
          <div style={{ marginBottom: "2.5rem" }}>
            <h2 style={{
              fontFamily: "var(--font-display), 'Playfair Display', Georgia, serif",
              fontSize: "1.875rem", fontWeight: 600,
              color: "#1C1612",
              letterSpacing: "-0.02em",
              marginBottom: "0.4rem",
            }}>
              Iniciar sesión
            </h2>
            <p style={{
              fontFamily: "var(--font-sans), system-ui, sans-serif",
              fontSize: "0.875rem",
              color: "#9C8E82",
            }}>
              Accede a tu cuenta
            </p>
          </div>

          {/* Formulario — sin bordes de card, campos directamente sobre la superficie */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            <div className="space-y-1.5">
              <Label htmlFor="email" style={{
                fontFamily: "var(--font-sans), system-ui, sans-serif",
                fontSize: "0.8125rem", fontWeight: 600,
                color: "#1C1612",
              }}>
                Correo electrónico
              </Label>
              <Input
                id="email" type="email"
                placeholder="correo@empresa.com"
                autoComplete="email"
                {...register("email")}
                className={errors.email ? "border-red-300" : ""}
                style={{
                  height: "2.75rem",
                  background: "#FFFFFF",
                  borderColor: errors.email ? "#FCA5A5" : "#E0D8CC",
                  color: "#1C1612",
                  fontSize: "0.9375rem",
                }}
              />
              {errors.email && (
                <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.75rem", color: "#991B1B" }}>
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" style={{
                fontFamily: "var(--font-sans), system-ui, sans-serif",
                fontSize: "0.8125rem", fontWeight: 600,
                color: "#1C1612",
              }}>
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register("password")}
                  className={errors.password ? "border-red-300" : ""}
                  style={{
                    height: "2.75rem",
                    background: "#FFFFFF",
                    borderColor: errors.password ? "#FCA5A5" : "#E0D8CC",
                    color: "#1C1612",
                    fontSize: "0.9375rem",
                    paddingRight: "2.75rem",
                  }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#9C8E82", cursor: "pointer" }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.75rem", color: "#991B1B" }}>
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={busy}
              className="w-full"
              style={{
                height: "2.75rem",
                background: busy ? "#E0D8CC" : "#B45309",
                color: busy ? "#9C8E82" : "#FFFFFF",
                border: "none",
                borderRadius: "6px",
                fontFamily: "var(--font-sans), system-ui, sans-serif",
                fontSize: "0.9375rem", fontWeight: 600,
                letterSpacing: "0.01em",
                cursor: busy ? "not-allowed" : "pointer",
                transition: "background 150ms ease",
              }}
            >
              {loading
                ? <><Loader2 size={15} className="mr-2 animate-spin" />Entrando…</>
                : "Entrar"}
            </Button>
          </form>

          {/* Separador demo */}
          <div className="flex items-center gap-3 my-7">
            <div style={{ flex: 1, height: "1px", background: "#E0D8CC" }} />
            <span style={{
              fontFamily: "var(--font-sans), system-ui, sans-serif",
              fontSize: "0.6875rem", fontWeight: 500,
              letterSpacing: "0.12em", textTransform: "uppercase",
              color: "#9C8E82",
            }}>demo</span>
            <div style={{ flex: 1, height: "1px", background: "#E0D8CC" }} />
          </div>

          {/* Botones demo — acceso rápido por rol */}
          <div className="space-y-2">
            {PERSONA_ORDER.map((key) => {
              const p = DEMO_PERSONAS[key]
              const isLoading = demoLoading === key
              return (
                <button
                  key={key}
                  onClick={() => handleEnterDemo(key)}
                  disabled={busy}
                  style={{
                    width: "100%",
                    display: "flex", alignItems: "center", gap: "0.875rem",
                    background: "#FFFFFF",
                    border: "1px solid #E0D8CC",
                    borderRadius: "6px",
                    padding: "0.625rem 0.875rem",
                    cursor: busy ? "not-allowed" : "pointer",
                    opacity: busy && !isLoading ? 0.5 : 1,
                    textAlign: "left",
                    transition: "border-color 120ms ease, background 120ms ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!busy) {
                      e.currentTarget.style.borderColor = "#B45309"
                      e.currentTarget.style.background = "#FFFBEB"
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#E0D8CC"
                    e.currentTarget.style.background = "#FFFFFF"
                  }}
                >
                  <div className={`h-8 w-8 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${p.color}`}
                    style={{ fontFamily: "var(--font-sans)" }}>
                    {isLoading ? <Loader2 size={11} className="animate-spin" /> : p.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{
                      fontFamily: "var(--font-sans), system-ui, sans-serif",
                      fontSize: "0.875rem", fontWeight: 600,
                      color: "#1C1612", lineHeight: 1.3,
                    }}>{p.name}</p>
                    <p style={{
                      fontFamily: "var(--font-mono), ui-monospace, monospace",
                      fontSize: "0.625rem", letterSpacing: "0.08em",
                      textTransform: "uppercase", color: "#9C8E82",
                    }}>{p.title}</p>
                  </div>
                  <span style={{
                    fontFamily: "var(--font-sans)", fontSize: "0.875rem",
                    color: "#B45309",
                  }}>
                    {isLoading ? "…" : "→"}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Footer */}
          <p style={{
            fontFamily: "var(--font-mono), ui-monospace, monospace",
            fontSize: "0.6rem", letterSpacing: "0.1em",
            color: "#C8BBAF", textTransform: "uppercase",
            textAlign: "center", marginTop: "2.5rem",
          }}>
            AmbrosIA · {year}
          </p>
        </div>
      </div>
    </div>
  )
}
