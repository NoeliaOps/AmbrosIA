import { cn } from "@/lib/utils"

type PageHeaderProps = {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
  meta?: string
}

export function PageHeader({ title, description, actions, className, meta }: PageHeaderProps) {
  return (
    <div className={cn("section-header", className)}>
      <div>
        <div className="flex items-baseline gap-3">
          <h1 style={{
            fontFamily: "var(--font-display), Georgia, serif",
            fontSize: "1.875rem",
            fontWeight: 700,
            color: "var(--text-1)",
            letterSpacing: "-0.025em",
            lineHeight: 1.2,
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
            marginTop: "0.25rem",
            letterSpacing: "0.01em",
          }}>{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  )
}
