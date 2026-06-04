import { cn } from "@/lib/utils"
import { type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

type EmptyStateProps = {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-6 py-16 text-center",
        className
      )}
    >
      {Icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      <h3 className="font-heading text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground font-sans max-w-xs">{description}</p>
      )}
      {action && (
        <Button
          onClick={action.onClick}
          className="mt-4 bg-[#2D2926] hover:bg-[#1A1714] text-white font-sans font-medium"
          size="sm"
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}
