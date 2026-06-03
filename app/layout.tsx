import type { Metadata } from "next"
import { Fraunces, Instrument_Sans, DM_Mono } from "next/font/google"
import { Toaster } from "sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import "./globals.css"

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700", "900"],
  style: ["normal", "italic"],
})

const instrumentSans = Instrument_Sans({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
})

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
    icon: "/brand/ambrosia-favicon.jpg",
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
      className={`${fraunces.variable} ${instrumentSans.variable} ${dmMono.variable} h-full antialiased`}
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
