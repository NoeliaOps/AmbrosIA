import type { Metadata } from "next"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MODULE_REGISTRY } from "@/lib/modules"

export const metadata: Metadata = { title: "Configuración" }

export default function ConfiguracionPage() {
  const coreModules = Object.entries(MODULE_REGISTRY).filter(
    ([, m]) => m.group === "core"
  )
  const optionalModules = Object.entries(MODULE_REGISTRY).filter(
    ([, m]) => m.group === "optional"
  )

  return (
    <div className="space-y-8">
      <PageHeader
        title="Configuración"
        description="Administra los módulos habilitados para tu organización."
      />

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Módulos principales</CardTitle>
          <CardDescription className="font-sans">
            Siempre habilitados. Son el núcleo del flujo operativo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {coreModules.map(([key, module]) => (
              <div
                key={key}
                className="flex items-center gap-3 rounded-md border border-border bg-muted/30 p-3"
              >
                <module.icon className="h-4 w-4 text-gold shrink-0" />
                <div>
                  <p className="text-sm font-medium font-sans">{module.label}</p>
                  <p className="text-xs text-muted-foreground font-sans">{module.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Módulos opcionales</CardTitle>
          <CardDescription className="font-sans">
            Actívalos según las necesidades de tu operación. (Toggle disponible próximamente)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {optionalModules.map(([key, module]) => (
              <div
                key={key}
                className="flex items-center gap-3 rounded-md border border-dashed border-border p-3 opacity-60"
              >
                <module.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium font-sans">{module.label}</p>
                  <p className="text-xs text-muted-foreground font-sans">{module.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
