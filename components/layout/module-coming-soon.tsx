import Link from "next/link"
import { ArrowRight, Check, type LucideIcon } from "lucide-react"

// Scaffold "en desarrollo" propio de cada módulo: comunica qué hará la
// función (no finge datos) con la identidad cromática del módulo.
type Props = {
  accent: string
  icon: LucideIcon
  headline: string
  capabilities: string[]
  cta?: { label: string; href: string }
}

export function ModuleComingSoon({ accent, icon: Icon, headline, capabilities, cta }: Props) {
  const soft = (p: number) => `color-mix(in srgb, ${accent} ${p}%, white)`
  return (
    <div className="enterprise-card overflow-hidden">
      <div className="relative p-8 sm:p-10" style={{ background: `linear-gradient(180deg, ${soft(5)} 0%, var(--card, #fff) 100%)` }}>
        <div className="max-w-xl space-y-5">
          <div className="flex items-center gap-3">
            <div className="grid place-items-center rounded-xl shrink-0" style={{ height: "2.75rem", width: "2.75rem", background: soft(12), color: accent, boxShadow: `inset 0 0 0 1px ${soft(28)}` }}>
              <Icon size={20} strokeWidth={1.75} />
            </div>
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: "0.6rem", fontWeight: 600,
              letterSpacing: "0.16em", textTransform: "uppercase", color: accent,
              background: soft(12), padding: "0.2rem 0.55rem", borderRadius: "9999px",
            }}>En desarrollo</span>
          </div>

          <h2 style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "1.5rem", fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
            {headline}
          </h2>

          <ul className="space-y-2">
            {capabilities.map((c) => (
              <li key={c} className="flex items-start gap-2.5">
                <span className="grid place-items-center rounded-full shrink-0 mt-0.5" style={{ height: "1.1rem", width: "1.1rem", background: soft(14), color: accent }}>
                  <Check size={11} strokeWidth={3} />
                </span>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.875rem", color: "var(--text-2)", lineHeight: 1.5 }}>{c}</span>
              </li>
            ))}
          </ul>

          {cta && (
            <Link href={cta.href} className="inline-flex items-center gap-1.5 rounded-md px-3.5 h-9 text-sm font-sans font-medium transition-colors" style={{ background: accent, color: "#fff" }}>
              {cta.label} <ArrowRight size={15} />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
