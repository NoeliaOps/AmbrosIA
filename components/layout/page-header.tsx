"use client"

import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { getModuleIdentity, accentSoft } from "@/lib/module-identity"

type PageHeaderProps = {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
  meta?: string
}

export function PageHeader({ title, description, actions, className, meta }: PageHeaderProps) {
  const pathname = usePathname()
  const { accent, icon: Icon, kicker } = getModuleIdentity(pathname)

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          {/* Crest — emblema del módulo con su acento */}
          <div
            className="shrink-0 grid place-items-center rounded-xl"
            style={{
              height: "2.75rem",
              width: "2.75rem",
              background: accentSoft(accent, 12),
              color: accent,
              boxShadow: `inset 0 0 0 1px ${accentSoft(accent, 28)}`,
            }}
          >
            <Icon size={20} strokeWidth={1.75} />
          </div>

          <div className="min-w-0">
            {/* Kicker — categoría funcional */}
            <p style={{
              fontFamily: "var(--font-mono), ui-monospace, monospace",
              fontSize: "0.6rem",
              fontWeight: 500,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: accent,
              marginBottom: "0.15rem",
            }}>{kicker}</p>

            <div className="flex items-baseline gap-3">
              <h1 style={{
                fontFamily: "var(--font-display), Georgia, serif",
                fontSize: "1.75rem",
                fontWeight: 700,
                color: "var(--text-1)",
                letterSpacing: "-0.025em",
                lineHeight: 1.15,
              }}>{title}</h1>
              {meta && (
                <span style={{
                  fontFamily: "var(--font-display), Georgia, serif",
                  fontSize: "0.9rem",
                  color: "var(--text-2)",
                  fontStyle: "italic",
                  letterSpacing: "0.01em",
                }} className="hidden sm:inline">{meta}</span>
              )}
            </div>

            {description && (
              <p style={{
                fontFamily: "var(--font-sans), system-ui, sans-serif",
                fontSize: "0.8rem",
                color: "var(--text-2)",
                marginTop: "0.2rem",
                letterSpacing: "0.01em",
              }}>{description}</p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>

      {/* Regla de acento — firma cromática del módulo */}
      <div className="flex items-center gap-2">
        <div style={{ height: "2px", width: "2.25rem", borderRadius: "9999px", background: accent }} />
        <div style={{ height: "1px", flex: 1, background: "var(--border-def, #EBEBEC)" }} />
      </div>
    </div>
  )
}
