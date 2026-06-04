"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { LogoWordmark } from "@/components/ui/logo"
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

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  async function signIn(email: string, password: string) {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error
  }

  async function onSubmit(data: LoginForm) {
    setLoading(true)
    const error = await signIn(data.email, data.password)
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
    if (result?.error) {
      toast.error(result.error)
      setDemoLoading(null)
    }
  }

  return (
    <div className="h-dvh flex overflow-hidden" style={{ background: "var(--void)" }}>

      {/* ── Left brand panel ─────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] flex-col relative overflow-y-auto"
        style={{ background: "var(--void)", borderRight: "1px solid var(--border-dim)" }}>

        {/* Subtle grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `
            linear-gradient(var(--border-dim) 1px, transparent 1px),
            linear-gradient(90deg, var(--border-dim) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
          opacity: 0.5,
        }} />

        {/* Amber glow top-left */}
        <div className="absolute top-0 left-0 pointer-events-none" style={{
          width: "400px",
          height: "400px",
          background: "radial-gradient(ellipse at top left, rgb(232 162 39 / 0.08), transparent 65%)",
        }} />

        {/* Noise grain */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          opacity: 0.04,
          mixBlendMode: "screen",
        }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-12 xl:p-16">
          {/* Logo */}
          <LogoWordmark size="md" />

          {/* Center hero */}
          <div className="flex-1 flex flex-col justify-center max-w-md">
            <div style={{
              fontFamily: "var(--font-mono), ui-monospace, monospace",
              fontSize: "0.65rem", letterSpacing: "0.2em",
              color: "var(--amber)", textTransform: "uppercase",
              marginBottom: "1.25rem",
            }}>Gestión de banquetes</div>

            <h1 style={{
              fontFamily: "var(--font-display), Georgia, serif",
              fontSize: "clamp(2rem, 3.5vw, 3rem)",
              fontWeight: 700,
              color: "var(--text-1)",
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              marginBottom: "1.5rem",
            }}>
              Cada evento,<br />
              <span style={{ color: "var(--amber)" }}>perfectamente</span><br />
              coordinado.
            </h1>

            <p style={{
              fontFamily: "var(--font-sans), system-ui, sans-serif",
              fontSize: "0.875rem",
              color: "var(--text-2)",
              lineHeight: 1.7,
              maxWidth: "360px",
            }}>
              Cotizaciones, contratos, requisiciones y utilidad real —
              todo en una herramienta diseñada para banqueteras profesionales.
            </p>

            {/* Feature pills */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "2rem" }}>
              {["Cotizaciones", "PDF automático", "Calendario", "Utilidad real"].map((f) => (
                <span key={f} style={{
                  fontFamily: "var(--font-mono), ui-monospace, monospace",
                  fontSize: "0.6rem", letterSpacing: "0.1em",
                  color: "var(--text-3)", textTransform: "uppercase",
                  border: "1px solid var(--border-dim)",
                  borderRadius: "4px", padding: "0.25rem 0.5rem",
                }}>{f}</span>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{
            borderTop: "1px solid var(--border-dim)",
            paddingTop: "1.25rem",
            display: "flex", justifyContent: "flex-end", alignItems: "center",
          }}>
            <p style={{
              fontFamily: "var(--font-mono), ui-monospace, monospace",
              fontSize: "0.6rem", color: "var(--text-3)",
            }}>v2.0 · {new Date().getFullYear()}</p>
          </div>
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 sm:px-8 pt-20 pb-8 sm:py-10 overflow-y-auto relative"
        style={{ background: "var(--surface-0)" }}>

        {/* Noise */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          opacity: 0.025, mixBlendMode: "screen",
        }} />

        {/* Mobile logo */}
        <div className="lg:hidden absolute top-5 left-5">
          <LogoWordmark size="sm" />
        </div>

        {/* Card */}
        <div className="relative z-10 w-full max-w-sm">
          <div style={{
            background: "var(--surface-1)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            boxShadow: "0 8px 40px rgb(0 0 0 / 0.4), 0 0 0 0.5px rgb(255 255 255 / 0.03) inset",
            padding: "2rem",
          }}>

            {/* Card heading */}
            <div style={{ marginBottom: "1.75rem" }}>
              <p style={{
                fontFamily: "var(--font-display), Georgia, serif",
                fontSize: "1.375rem", fontWeight: 600,
                color: "var(--text-1)", letterSpacing: "-0.02em",
                marginBottom: "0.25rem",
              }}>Iniciar sesión</p>
              <p style={{
                fontFamily: "var(--font-sans), system-ui, sans-serif",
                fontSize: "0.75rem", color: "var(--text-2)",
              }}>Accede a tu cuenta</p>
              <div style={{
                marginTop: "1rem", height: "1px",
                background: "linear-gradient(to right, var(--amber), transparent)",
              }} />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" style={{
                  fontFamily: "var(--font-mono), ui-monospace, monospace",
                  fontSize: "0.65rem", letterSpacing: "0.12em",
                  textTransform: "uppercase", color: "var(--text-2)",
                }}>Correo electrónico</Label>
                <Input
                  id="email" type="email"
                  placeholder="correo@empresa.com"
                  autoComplete="email"
                  {...register("email")}
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    borderRadius: "5px", fontSize: "13.5px",
                    color: "var(--text-1)",
                  }}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" style={{
                  fontFamily: "var(--font-mono), ui-monospace, monospace",
                  fontSize: "0.65rem", letterSpacing: "0.12em",
                  textTransform: "uppercase", color: "var(--text-2)",
                }}>Contraseña</Label>
                <Input
                  id="password" type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register("password")}
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    borderRadius: "5px", fontSize: "13.5px",
                    color: "var(--text-1)",
                  }}
                  className={errors.password ? "border-destructive" : ""}
                />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>

              <Button
                type="submit"
                disabled={loading || !!demoLoading}
                className="w-full"
                style={{
                  background: loading ? "var(--border-str)" : "var(--amber)",
                  color: "#0C0C0A",
                  border: "none", borderRadius: "5px",
                  fontFamily: "var(--font-sans), system-ui, sans-serif",
                  fontSize: "0.8125rem", letterSpacing: "0.02em",
                  fontWeight: 600, height: "2.5rem",
                  transition: "background 150ms ease",
                }}
              >
                {loading
                  ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Entrando…</>
                  : "Iniciar sesión"}
              </Button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div style={{ flex: 1, height: "1px", background: "var(--border-dim)" }} />
              <span style={{
                fontFamily: "var(--font-mono), ui-monospace, monospace",
                fontSize: "0.6rem", color: "var(--text-3)",
                letterSpacing: "0.1em", textTransform: "uppercase",
              }}>demo</span>
              <div style={{ flex: 1, height: "1px", background: "var(--border-dim)" }} />
            </div>

            {/* Demo personas */}
            <div className="space-y-1.5">
              {PERSONA_ORDER.map((key) => {
                const p = DEMO_PERSONAS[key]
                const isLoading = demoLoading === key
                return (
                  <button
                    key={key}
                    onClick={() => handleEnterDemo(key)}
                    disabled={loading || !!demoLoading}
                    style={{
                      width: "100%",
                      display: "flex", alignItems: "center", gap: "0.75rem",
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      borderRadius: "5px",
                      padding: "0.5rem 0.75rem",
                      cursor: loading || !!demoLoading ? "not-allowed" : "pointer",
                      opacity: loading || !!demoLoading ? 0.5 : 1,
                      transition: "border-color 120ms ease, background 120ms ease",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => {
                      if (!loading && !demoLoading) {
                        e.currentTarget.style.borderColor = "rgb(232 162 39 / 0.4)"
                        e.currentTarget.style.background = "var(--surface-3)"
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)"
                      e.currentTarget.style.background = "var(--surface-2)"
                    }}
                  >
                    <div className={`h-7 w-7 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${p.color}`}
                      style={{ fontFamily: "var(--font-sans)" }}>
                      {isLoading ? <Loader2 size={11} className="animate-spin" /> : p.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{
                        fontFamily: "var(--font-sans), system-ui, sans-serif",
                        fontSize: "0.8125rem", fontWeight: 500,
                        color: "var(--text-1)", lineHeight: 1.3,
                      }} className="truncate">{p.name}</p>
                      <p style={{
                        fontFamily: "var(--font-mono), ui-monospace, monospace",
                        fontSize: "0.6rem", letterSpacing: "0.08em",
                        textTransform: "uppercase", color: "var(--text-3)",
                      }} className="truncate">{p.title}</p>
                    </div>
                    <span style={{
                      fontFamily: "var(--font-mono), ui-monospace, monospace",
                      fontSize: "0.6rem", color: "var(--amber)", letterSpacing: "0.08em",
                    }}>
                      {isLoading ? "…" : "→"}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Footer */}
          <p style={{
            fontFamily: "var(--font-mono), ui-monospace, monospace",
            fontSize: "0.6rem", letterSpacing: "0.1em",
            color: "var(--text-3)", textTransform: "uppercase",
            textAlign: "center", marginTop: "1.5rem",
          }}>
            AmbrosIA · {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}
