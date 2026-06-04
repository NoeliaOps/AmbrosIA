import type { Metadata } from "next"
import { Playfair_Display, Karla, DM_Mono } from "next/font/google"
import { Toaster } from "sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import "./globals.css"

// Display serif — Playfair Display para encabezados h1/h2 únicamente
const playfairDisplay = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
})

// Humanist sans-serif — Karla para todo el chrome de UI
const karla = Karla({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
})

// Monospace — DM Mono exclusivamente para datos numéricos
const dmMono = DM_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
})

export const metadata: Metadata = {
  title: {
    default: "AmbrosIA",
    template: "%s — AmbrosIA",
  },
  description: "Gestión integral para banqueteras y catering",
  icons: {
    icon: [
      { url: "/brand/ambrosia-favicon.svg", type: "image/svg+xml" },
      { url: "/brand/ambrosia-favicon.svg", sizes: "any" },
    ],
    apple: "/brand/ambrosia-touchicon.jpg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es-MX"
      className={`${playfairDisplay.variable} ${karla.variable} ${dmMono.variable} h-full antialiased`}
    >
      <body className="h-full">
        <TooltipProvider delay={300}>
          {children}
        </TooltipProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
