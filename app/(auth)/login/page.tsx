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

// ── Colores locales del login (sin depender de CSS vars para máxima fiabilidad) ──
const C = {
  slateDark:    "#2A2D35",   // sidebar pizarra
  slateDeep:    "#1E2128",   // más oscuro para acentos
  slateAccent:  "#363A46",   // hover en panel oscuro
  champagne:    "#C4963B",   // dorado champagne — solo decorativo
  champagneTxt: "#8B6D24",   // champagne apto para texto (4.54:1)
  charcoal:     "#2D2926",   // botón CTA
  charcoalHov:  "#1A1714",   // hover CTA
  white:        "#FFFFFF",
  bg:           "#FFFFFF",   // fondo formulario
  text1:        "#1A1A1A",
  text2:        "#4B5563",
  text3:        "#9CA3AF",
  border:       "#E5E7EB",
  inputBg:      "#F9FAFB",
}

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading]   = useState(false)
  const [demoLoading, setDemoLoading] = useState<DemoPersona | null>(null)
  const [showPass, setShowPass] = useState(false)
  const [ctaHover, setCtaHover] = useState(false)

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
    /* ── Contenedor raíz: flex, min-h-dvh garantiza que llene pantalla ── */
    <div style={{ display: "flex", minHeight: "100dvh", background: C.slateDark }}>

      {/* ════════════════════════════════════════════════════════
          PANEL IZQUIERDO — Brand story (pizarra oscuro)
          flex-shrink-0 + width explícito = nunca se encoge
          ════════════════════════════════════════════════════════ */}
      <div
        style={{
          flexShrink: 0,
          width: "54%",
          background: C.slateDark,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
        }}
        className="hidden lg:flex"
      >
        {/* Patrón de líneas — retícula muy sutil */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: `linear-gradient(rgb(255 255 255 / 0.02) 1px, transparent 1px),
                            linear-gradient(90deg, rgb(255 255 255 / 0.02) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }} />

        {/* Glow champagne superior derecho */}
        <div style={{
          position: "absolute", top: "-15%", right: "-10%",
          width: "480px", height: "480px", pointerEvents: "none",
          background: `radial-gradient(ellipse at center, rgb(196 150 59 / 0.14) 0%, transparent 65%)`,
          borderRadius: "50%",
        }} />

        {/* Glow inferior izquierdo */}
        <div style={{
          position: "absolute", bottom: "0%", left: "-8%",
          width: "320px", height: "320px", pointerEvents: "none",
          background: `radial-gradient(ellipse at center, rgb(196 150 59 / 0.07) 0%, transparent 65%)`,
          borderRadius: "50%",
        }} />

        {/* Contenido */}
        <div style={{
          position: "relative", zIndex: 1,
          display: "flex", flexDirection: "column",
          height: "100%", padding: "3rem 3.5rem",
        }}>
          {/* Wordmark */}
          <div style={{ display: "flex", alignItems: "baseline", userSelect: "none" }}>
            <span style={{
              fontFamily: "var(--font-display), Georgia, serif",
              fontSize: "1.5rem", fontWeight: 700,
              color: C.champagne, letterSpacing: "-0.02em",
            }}>A</span>
            <span style={{
              fontFamily: "var(--font-display), Georgia, serif",
              fontSize: "0.95rem", fontWeight: 400,
              color: "rgb(232 234 240 / 0.55)", letterSpacing: "0.04em",
            }}>mbros</span>
            <span style={{
              fontFamily: "var(--font-display), Georgia, serif",
              fontSize: "0.95rem", fontWeight: 700,
              color: C.champagne, letterSpacing: "0.04em",
            }}>IA</span>
          </div>

          {/* Hero */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: "400px" }}>

            <p style={{
              fontFamily: "var(--font-sans), system-ui, sans-serif",
              fontSize: "0.6875rem", fontWeight: 500,
              letterSpacing: "0.22em", textTransform: "uppercase",
              color: C.champagne, marginBottom: "1.5rem",
            }}>
              Gestión de banquetes
            </p>

            <h1 style={{
              fontFamily: "var(--font-display), Georgia, serif",
              fontSize: "clamp(2.25rem, 3.2vw, 3.125rem)",
              fontWeight: 700, lineHeight: 1.1,
              letterSpacing: "-0.025em",
              color: "rgb(232 234 240 / 0.95)",
              marginBottom: "1.5rem",
            }}>
              Para quienes<br />
              convierten una fecha<br />
              <em style={{ color: C.champagne, fontStyle: "italic" }}>en un recuerdo.</em>
            </h1>

            {/* Línea divisora champagne */}
            <div style={{
              width: "3rem", height: "1px",
              background: C.champagne, opacity: 0.5,
              marginBottom: "1.5rem",
            }} />

            <p style={{
              fontFamily: "var(--font-sans), system-ui, sans-serif",
              fontSize: "0.9375rem", lineHeight: 1.7,
              color: "rgb(232 234 240 / 0.45)",
              marginBottom: "2.5rem",
            }}>
              Control de recetas, costos y eventos en una sola herramienta.
            </p>

            {/* Features 2×2 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              {[
                ["Recetas & costos",  "Control exacto de ingredientes"],
                ["Cotizaciones PDF",  "Listas en segundos"],
                ["Calendario",        "Todos los eventos a la vista"],
                ["Utilidad real",     "Saber qué deja cada evento"],
              ].map(([title, sub]) => (
                <div key={title} style={{
                  borderLeft: "2px solid rgb(196 150 59 / 0.35)",
                  paddingLeft: "0.875rem",
                }}>
                  <p style={{
                    fontFamily: "var(--font-sans), system-ui, sans-serif",
                    fontSize: "0.8125rem", fontWeight: 600,
                    color: "rgb(232 234 240 / 0.8)",
                    marginBottom: "0.2rem",
                  }}>{title}</p>
                  <p style={{
                    fontFamily: "var(--font-sans), system-ui, sans-serif",
                    fontSize: "0.7rem",
                    color: "rgb(232 234 240 / 0.35)",
                  }}>{sub}</p>
                </div>
              ))}
            </div>
          </div>

          <p style={{
            fontFamily: "var(--font-mono), ui-monospace, monospace",
            fontSize: "0.6rem", letterSpacing: "0.12em",
            color: "rgb(232 234 240 / 0.18)",
          }}>© {year} AmbrosIA</p>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          PANEL DERECHO — Formulario limpio sobre blanco
          flex: 1 + min-h-dvh garantiza que llene el espacio
          ════════════════════════════════════════════════════════ */}
      <div style={{
        flex: 1,
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "2.5rem 2rem",
        minHeight: "100dvh",
        overflowY: "auto",
      }}>
        {/* Logo mobile */}
        <div style={{
          position: "absolute", top: "1.5rem", left: "1.5rem",
          display: "flex", alignItems: "baseline",
        }} className="lg:hidden">
          <span style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "1.375rem", fontWeight: 700, color: C.champagne }}>A</span>
          <span style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "0.875rem", fontWeight: 400, color: C.text2 }}>mbros</span>
          <span style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "0.875rem", fontWeight: 700, color: C.champagne }}>IA</span>
        </div>

        <div style={{ width: "100%", maxWidth: "22rem" }}>

          {/* Heading */}
          <div style={{ marginBottom: "2.25rem" }}>
            <h2 style={{
              fontFamily: "var(--font-display), Georgia, serif",
              fontSize: "1.875rem", fontWeight: 600,
              color: C.text1, letterSpacing: "-0.02em",
              marginBottom: "0.375rem",
            }}>Iniciar sesión</h2>
            <p style={{
              fontFamily: "var(--font-sans), system-ui, sans-serif",
              fontSize: "0.875rem", color: C.text3,
            }}>Accede a tu cuenta</p>
            {/* Línea champagne decorativa */}
            <div style={{
              marginTop: "1rem", height: "1px", width: "2.5rem",
              background: C.champagne, opacity: 0.6,
            }} />
          </div>

          {/* Formulario — directo sobre la superficie, sin card */}
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

            <div>
              <Label htmlFor="email" style={{
                fontFamily: "var(--font-sans), system-ui, sans-serif",
                fontSize: "0.8125rem", fontWeight: 600, color: C.text1,
                display: "block", marginBottom: "0.5rem",
              }}>Correo electrónico</Label>
              <Input
                id="email" type="email"
                placeholder="correo@empresa.com"
                autoComplete="email"
                {...register("email")}
                style={{
                  height: "2.75rem",
                  background: C.inputBg,
                  borderColor: errors.email ? "#FCA5A5" : C.border,
                  color: C.text1, fontSize: "0.9375rem",
                  borderRadius: "6px",
                }}
              />
              {errors.email && (
                <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.75rem", color: "#991B1B", marginTop: "0.375rem" }}>
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password" style={{
                fontFamily: "var(--font-sans), system-ui, sans-serif",
                fontSize: "0.8125rem", fontWeight: 600, color: C.text1,
                display: "block", marginBottom: "0.5rem",
              }}>Contraseña</Label>
              <div style={{ position: "relative" }}>
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register("password")}
                  style={{
                    height: "2.75rem",
                    background: C.inputBg,
                    borderColor: errors.password ? "#FCA5A5" : C.border,
                    color: C.text1, fontSize: "0.9375rem",
                    borderRadius: "6px",
                    paddingRight: "3rem",
                  }}
                />
                <button
                  type="button" tabIndex={-1}
                  onClick={() => setShowPass(v => !v)}
                  style={{
                    position: "absolute", right: "0.875rem", top: "50%",
                    transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: C.text3, padding: "0.25rem",
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.75rem", color: "#991B1B", marginTop: "0.375rem" }}>
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={busy}
              onMouseEnter={() => setCtaHover(true)}
              onMouseLeave={() => setCtaHover(false)}
              style={{
                height: "2.875rem",
                background: busy ? C.border : (ctaHover ? C.charcoalHov : C.charcoal),
                color: busy ? C.text3 : C.white,
                border: "none", borderRadius: "6px",
                fontFamily: "var(--font-sans), system-ui, sans-serif",
                fontSize: "0.9375rem", fontWeight: 600,
                letterSpacing: "0.01em",
                cursor: busy ? "not-allowed" : "pointer",
                transition: "background 150ms ease",
                marginTop: "0.25rem",
              }}
            >
              {loading
                ? <><Loader2 size={15} className="mr-2 animate-spin" />Entrando…</>
                : "Entrar"}
            </Button>
          </form>

          {/* Separador demo */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", margin: "1.75rem 0" }}>
            <div style={{ flex: 1, height: "1px", background: C.border }} />
            <span style={{
              fontFamily: "var(--font-sans), system-ui, sans-serif",
              fontSize: "0.6875rem", fontWeight: 500,
              letterSpacing: "0.14em", textTransform: "uppercase", color: C.text3,
            }}>demo</span>
            <div style={{ flex: 1, height: "1px", background: C.border }} />
          </div>

          {/* Acceso demo por rol */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {PERSONA_ORDER.map((key) => {
              const p = DEMO_PERSONAS[key]
              const isLoading = demoLoading === key
              return (
                <button
                  key={key}
                  onClick={() => handleEnterDemo(key)}
                  disabled={busy}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: "0.875rem",
                    background: C.white, border: `1px solid ${C.border}`,
                    borderRadius: "6px", padding: "0.625rem 0.875rem",
                    cursor: busy ? "not-allowed" : "pointer",
                    opacity: busy && !isLoading ? 0.5 : 1,
                    textAlign: "left",
                    transition: "border-color 120ms ease, background 120ms ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!busy) {
                      e.currentTarget.style.borderColor = C.charcoal
                      e.currentTarget.style.background = "#F9FAFB"
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = C.border
                    e.currentTarget.style.background = C.white
                  }}
                >
                  <div className={`h-8 w-8 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${p.color}`}>
                    {isLoading ? <Loader2 size={11} className="animate-spin" /> : p.initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                    <p style={{
                      fontFamily: "var(--font-sans), system-ui, sans-serif",
                      fontSize: "0.875rem", fontWeight: 600,
                      color: C.text1, lineHeight: 1.3,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>{p.name}</p>
                    <p style={{
                      fontFamily: "var(--font-mono), ui-monospace, monospace",
                      fontSize: "0.6rem", letterSpacing: "0.08em",
                      textTransform: "uppercase", color: C.text3,
                    }}>{p.title}</p>
                  </div>
                  <span style={{ fontFamily: "var(--font-sans)", color: C.text3, fontSize: "0.875rem" }}>
                    {isLoading ? "…" : "→"}
                  </span>
                </button>
              )
            })}
          </div>

          <p style={{
            fontFamily: "var(--font-mono), ui-monospace, monospace",
            fontSize: "0.6rem", letterSpacing: "0.12em",
            color: C.text3, textTransform: "uppercase",
            textAlign: "center", marginTop: "2rem",
          }}>
            AmbrosIA · {year}
          </p>
        </div>
      </div>
    </div>
  )
}
