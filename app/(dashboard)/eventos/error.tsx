"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function EventosError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center">
      <AlertTriangle size={24} className="text-red-400" />
      <div className="space-y-1">
        <p className="font-heading font-semibold text-ink">Error al cargar eventos</p>
        <p className="text-sm font-sans text-muted-foreground">Verifica tu conexión e intenta de nuevo.</p>
      </div>
      <Button onClick={reset} variant="outline" className="font-sans text-sm">Reintentar</Button>
    </div>
  )
}
