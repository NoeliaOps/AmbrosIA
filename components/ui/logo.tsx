type LogoWordmarkProps = {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function LogoWordmark({ className, size = "md" }: LogoWordmarkProps) {
  const sizes = {
    sm: { mark: "1.375rem", text: "0.8rem"  },
    md: { mark: "1.625rem", text: "0.9rem"  },
    lg: { mark: "2.25rem",  text: "1.25rem" },
  }
  const s = sizes[size]

  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "baseline",
        lineHeight: 1,
        userSelect: "none",
        gap: "0.02em",
      }}
    >
      <span style={{
        fontFamily: "var(--font-display), Georgia, serif",
        fontSize: s.mark,
        fontWeight: 700,
        color: "var(--amber, #D4952B)",
        letterSpacing: "-0.03em",
        lineHeight: 1,
      }}>A</span>
      <span style={{
        fontFamily: "var(--font-display), Georgia, serif",
        fontSize: s.text,
        fontWeight: 300,
        color: "rgb(232 226 216 / 0.85)",
        letterSpacing: "0.06em",
        lineHeight: 1,
      }}>mbros</span>
      <span style={{
        fontFamily: "var(--font-display), Georgia, serif",
        fontSize: s.text,
        fontWeight: 700,
        color: "var(--amber, #D4952B)",
        letterSpacing: "0.06em",
        lineHeight: 1,
      }}>IA</span>
    </div>
  )
}
