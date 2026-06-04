"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2, Eye, EyeOff, ArrowRight } from "lucide-react"
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

// ── Paleta local "Pizarra & Champagne" (sin depender de CSS vars al render crítico) ──
const C = {
  slate:      "#2A2D35",  // pizarra (panel de marca)
  slateDeep:  "#1F222A",  // base del degradado
  champagne:  "#C4963B",  // dorado champagne — solo decorativo
  champagneT: "#8B6D24",  // champagne apto para texto (4.54:1)
  charcoal:   "#2D2926",  // CTA
  charcoalH:  "#1A1714",  // CTA hover
  white:      "#FFFFFF",
  text1:      "#1A1A1A",
  text2:      "#4B5563",
  text3:      "#9CA3AF",
  border:     "#E5E7EB",
  inputBg:    "#F9FAFB",
  ink:        "rgb(232 234 240",  // texto sobre pizarra (cerrar con "/ a)")
}

const serif = "var(--font-display), Georgia, serif"
const sans  = "var(--font-sans), system-ui, sans-serif"
const mono  = "var(--font-mono), ui-monospace, monospace"

function Wordmark({ size = 1.5, onDark }: { size?: number; onDark?: boolean }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", userSelect: "none", lineHeight: 1 }}>
      <span style={{ fontFamily: serif, fontSize: `${size}rem`, fontWeight: 700, color: C.champagne, letterSpacing: "-0.02em" }}>A</span>
      <span style={{ fontFamily: serif, fontSize: `${size * 0.64}rem`, fontWeight: 400, color: onDark ? `${C.ink} / 0.6)` : C.text2, letterSpacing: "0.04em" }}>mbros</span>
      <span style={{ fontFamily: serif, fontSize: `${size * 0.64}rem`, fontWeight: 700, color: C.champagne, letterSpacing: "0.04em" }}>IA</span>
    </span>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
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
    /* ──────────────────────────────────────────────────────────────
       RAÍZ — grid a pantalla completa. Cada celda ESTIRA a 100% de
       alto y ancho por defecto en grid → imposible que quede "en cuadro".
       Móvil: 1 columna. Desktop: pizarra (más ancha) + formulario.
       ────────────────────────────────────────────────────────────── */
    <main
      style={{ minHeight: "100dvh", width: "100%", display: "grid" }}
      className="grid-cols-1 lg:grid-cols-[1.15fr_minmax(0,520px)]"
    >
      {/* ═══════════════ PANEL DE MARCA (pizarra) ═══════════════ */}
      <section
        className="hidden lg:block"
        style={{
          position: "relative",
          overflow: "hidden",
          background: `linear-gradient(150deg, ${C.slate} 0%, ${C.slateDeep} 100%)`,
        }}
      >
        {/* Retícula muy sutil */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: `linear-gradient(rgb(255 255 255 / 0.022) 1px, transparent 1px),
                            linear-gradient(90deg, rgb(255 255 255 / 0.022) 1px, transparent 1px)`,
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 90% 80% at 40% 35%, #000 40%, transparent 100%)",
        }} />
        {/* Glow champagne superior */}
        <div style={{
          position: "absolute", top: "-18%", right: "-12%",
          width: "560px", height: "560px", pointerEvents: "none", borderRadius: "50%",
          background: "radial-gradient(circle at center, rgb(196 150 59 / 0.16) 0%, transparent 62%)",
        }} />
        {/* Glow inferior */}
        <div style={{
          position: "absolute", bottom: "-14%", left: "-10%",
          width: "400px", height: "400px", pointerEvents: "none", borderRadius: "50%",
          background: "radial-gradient(circle at center, rgb(196 150 59 / 0.06) 0%, transparent 60%)",
        }} />

        {/* Contenido del panel */}
        <div style={{
          position: "relative", zIndex: 1, height: "100%",
          display: "flex", flexDirection: "column",
          padding: "clamp(2.5rem, 4vw, 4rem)",
        }}>
          <Wordmark size={1.5} onDark />

          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: "32rem" }}>
            <p style={{
              fontFamily: sans, fontSize: "0.6875rem", fontWeight: 600,
              letterSpacing: "0.24em", textTransform: "uppercase",
              color: C.champagne, marginBottom: "1.75rem",
            }}>
              Gestión de banquetes
            </p>

            <h1 style={{
              fontFamily: serif, fontWeight: 700,
              fontSize: "clamp(2.5rem, 3.6vw, 3.5rem)", lineHeight: 1.08,
              letterSpacing: "-0.025em", color: `${C.ink} / 0.96)`,
              marginBottom: "1.75rem",
            }}>
              Para quienes<br />
              convierten una fecha<br />
              <em style={{ fontStyle: "italic", color: C.champagne }}>en un recuerdo.</em>
            </h1>

            <div style={{ width: "3.25rem", height: "2px", background: C.champagne, opacity: 0.55, marginBottom: "1.75rem" }} />

            <p style={{
              fontFamily: sans, fontSize: "1rem", lineHeight: 1.7,
              color: `${C.ink} / 0.5)`, marginBottom: "2.75rem", maxWidth: "26rem",
            }}>
              Recetas, costos, cotizaciones y calendario de eventos. Todo el banquete bajo control, en una sola herramienta.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem 1.5rem", maxWidth: "26rem" }}>
              {[
                ["Recetas & costos", "Control exacto de cada ingrediente"],
                ["Cotizaciones PDF", "Listas para enviar en segundos"],
                ["Calendario", "Todos los eventos del mes a la vista"],
                ["Utilidad real", "Cuánto deja cada evento"],
              ].map(([title, sub]) => (
                <div key={title} style={{ borderLeft: "2px solid rgb(196 150 59 / 0.4)", paddingLeft: "0.875rem" }}>
                  <p style={{ fontFamily: sans, fontSize: "0.8125rem", fontWeight: 600, color: `${C.ink} / 0.85)`, marginBottom: "0.2rem" }}>{title}</p>
                  <p style={{ fontFamily: sans, fontSize: "0.75rem", lineHeight: 1.4, color: `${C.ink} / 0.4)` }}>{sub}</p>
                </div>
              ))}
            </div>
          </div>

          <p style={{ fontFamily: mono, fontSize: "0.625rem", letterSpacing: "0.12em", color: `${C.ink} / 0.22)` }}>
            © {year} AmbrosIA
          </p>
        </div>
      </section>

      {/* ═══════════════ PANEL DE FORMULARIO (blanco) ═══════════════ */}
      <section style={{
        position: "relative",
        background: C.white,
        display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center",
        padding: "clamp(2rem, 5vw, 3rem) 1.5rem",
      }}>
        {/* Wordmark sólo en móvil (dentro del panel, NO escapa al fondo) */}
        <div className="lg:hidden" style={{ position: "absolute", top: "1.75rem", left: "1.75rem" }}>
          <Wordmark size={1.375} />
        </div>

        <div style={{ width: "100%", maxWidth: "23rem" }}>
          <div style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontFamily: serif, fontSize: "1.875rem", fontWeight: 600, color: C.text1, letterSpacing: "-0.02em", marginBottom: "0.375rem" }}>
              Bienvenido de nuevo
            </h2>
            <p style={{ fontFamily: sans, fontSize: "0.9375rem", color: C.text3 }}>
              Inicia sesión para continuar
            </p>
            <div style={{ marginTop: "1.125rem", height: "2px", width: "2.5rem", background: C.champagne, opacity: 0.6 }} />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <Label htmlFor="email" style={{ fontFamily: sans, fontSize: "0.8125rem", fontWeight: 600, color: C.text1, display: "block", marginBottom: "0.5rem" }}>
                Correo electrónico
              </Label>
              <Input
                id="email" type="email" placeholder="correo@empresa.com" autoComplete="email"
                {...register("email")}
                style={{
                  height: "2.875rem", background: C.inputBg,
                  borderColor: errors.email ? "#FCA5A5" : C.border,
                  color: C.text1, fontSize: "0.9375rem", borderRadius: "8px",
                }}
              />
              {errors.email && <p style={{ fontFamily: sans, fontSize: "0.75rem", color: "#991B1B", marginTop: "0.375rem" }}>{errors.email.message}</p>}
            </div>

            <div>
              <Label htmlFor="password" style={{ fontFamily: sans, fontSize: "0.8125rem", fontWeight: 600, color: C.text1, display: "block", marginBottom: "0.5rem" }}>
                Contraseña
              </Label>
              <div style={{ position: "relative" }}>
                <Input
                  id="password" type={showPass ? "text" : "password"} placeholder="••••••••" autoComplete="current-password"
                  {...register("password")}
                  style={{
                    height: "2.875rem", background: C.inputBg,
                    borderColor: errors.password ? "#FCA5A5" : C.border,
                    color: C.text1, fontSize: "0.9375rem", borderRadius: "8px", paddingRight: "3rem",
                  }}
                />
                <button
                  type="button" tabIndex={-1} aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                  onClick={() => setShowPass(v => !v)}
                  style={{ position: "absolute", right: "0.875rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.text3, padding: "0.25rem", display: "inline-flex" }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p style={{ fontFamily: sans, fontSize: "0.75rem", color: "#991B1B", marginTop: "0.375rem" }}>{errors.password.message}</p>}
            </div>

            <Button
              type="submit" disabled={busy}
              onMouseEnter={() => setCtaHover(true)} onMouseLeave={() => setCtaHover(false)}
              style={{
                height: "2.875rem",
                background: busy ? C.border : (ctaHover ? C.charcoalH : C.charcoal),
                color: busy ? C.text3 : C.white,
                border: "none", borderRadius: "8px",
                fontFamily: sans, fontSize: "0.9375rem", fontWeight: 600, letterSpacing: "0.01em",
                cursor: busy ? "not-allowed" : "pointer",
                transition: "background 150ms ease", marginTop: "0.25rem",
              }}
            >
              {loading ? <><Loader2 size={15} className="mr-2 animate-spin" />Entrando…</> : "Entrar"}
            </Button>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", margin: "1.75rem 0 1.25rem" }}>
            <div style={{ flex: 1, height: "1px", background: C.border }} />
            <span style={{ fontFamily: sans, fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: C.text3 }}>
              o explora la demo
            </span>
            <div style={{ flex: 1, height: "1px", background: C.border }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {PERSONA_ORDER.map((key) => {
              const p = DEMO_PERSONAS[key]
              const isLoading = demoLoading === key
              return (
                <button
                  key={key} onClick={() => handleEnterDemo(key)} disabled={busy}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: "0.875rem",
                    background: C.white, border: `1px solid ${C.border}`, borderRadius: "8px",
                    padding: "0.625rem 0.875rem",
                    cursor: busy ? "not-allowed" : "pointer",
                    opacity: busy && !isLoading ? 0.5 : 1,
                    textAlign: "left", transition: "border-color 120ms ease, background 120ms ease",
                  }}
                  onMouseEnter={(e) => { if (!busy) { e.currentTarget.style.borderColor = C.charcoal; e.currentTarget.style.background = C.inputBg } }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.white }}
                >
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${p.color}`}>
                    {isLoading ? <Loader2 size={12} className="animate-spin" /> : p.initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: sans, fontSize: "0.875rem", fontWeight: 600, color: C.text1, lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</p>
                    <p style={{ fontFamily: mono, fontSize: "0.6rem", letterSpacing: "0.08em", textTransform: "uppercase", color: C.text3 }}>{p.title}</p>
                  </div>
                  <span style={{ color: C.text3, display: "inline-flex" }}>
                    {isLoading ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={15} />}
                  </span>
                </button>
              )
            })}
          </div>

          <p style={{ fontFamily: mono, fontSize: "0.6rem", letterSpacing: "0.12em", color: C.text3, textTransform: "uppercase", textAlign: "center", marginTop: "2rem" }}>
            AmbrosIA · {year}
          </p>
        </div>
      </section>
    </main>
  )
}
