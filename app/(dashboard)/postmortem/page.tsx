import type { Metadata } from "next"
import { PageHeader } from "@/components/layout/page-header"
import { MessageSquare } from "lucide-react"

export const metadata: Metadata = { title: "Post-mortem" }

export default function PostmortemPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Post-mortem" description="Notas y lecciones aprendidas por evento." />
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center rounded-lg border border-dashed border-border p-16">
        <MessageSquare size={32} className="text-muted-foreground/30" />
        <p className="font-heading font-semibold text-ink">Próximamente</p>
        <p className="text-sm font-sans text-muted-foreground max-w-sm">
          El registro de lecciones aprendidas está en desarrollo.
        </p>
      </div>
    </div>
  )
}
