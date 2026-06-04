type LogoWordmarkProps = {
  className?: string
  size?: "sm" | "md" | "lg"
  variant?: "dark" | "light"  // dark = sobre fondo oscuro, light = sobre fondo claro
}

export function LogoWordmark({ className, size = "md", variant = "dark" }: LogoWordmarkProps) {
  const sizes = {
    sm: { mark: "1.375rem", text: "0.8rem"  },
    md: { mark: "1.625rem", text: "0.9rem"  },
    lg: { mark: "2.25rem",  text: "1.25rem" },
  }
  const s = sizes[size]

  const textColor = variant === "dark"
    ? "rgb(232 224 212 / 0.75)"   // crema sobre fondo oscuro
    : "#6B5E54"                    // marrón cálido sobre fondo claro

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
        fontFamily: "var(--font-display), 'Playfair Display', Georgia, serif",
        fontSize: s.mark,
        fontWeight: 700,
        color: "#B45309",
        letterSpacing: "-0.025em",
        lineHeight: 1,
      }}>A</span>
      <span style={{
        fontFamily: "var(--font-display), 'Playfair Display', Georgia, serif",
        fontSize: s.text,
        fontWeight: 400,
        color: textColor,
        letterSpacing: "0.04em",
        lineHeight: 1,
      }}>mbros</span>
      <span style={{
        fontFamily: "var(--font-display), 'Playfair Display', Georgia, serif",
        fontSize: s.text,
        fontWeight: 700,
        color: "#B45309",
        letterSpacing: "0.04em",
        lineHeight: 1,
      }}>IA</span>
    </div>
  )
}
