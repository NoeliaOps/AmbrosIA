"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 border border-red-100">
        <AlertTriangle size={20} className="text-red-500" />
      </div>
      <div className="space-y-1">
        <p className="font-heading font-semibold text-ink">Algo salió mal</p>
        <p className="text-sm font-sans text-muted-foreground max-w-sm">
          Ocurrió un error al cargar esta sección. Intenta de nuevo.
        </p>
      </div>
      <Button onClick={reset} variant="outline" className="font-sans text-sm">
        Reintentar
      </Button>
    </div>
  )
}
