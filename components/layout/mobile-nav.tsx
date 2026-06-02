"use client"

import { useState } from "react"
import { Menu, X } from "lucide-react"
import { Sidebar } from "./sidebar"
import type { ModuleKey } from "@/lib/modules"
import type { Tables } from "@/lib/supabase/types"
import type { DemoPersona } from "@/lib/demo"

type Profile = Pick<Tables<"profiles">, "full_name" | "email" | "role">

type Props = {
  profile: Profile | null
  enabledModules: Set<ModuleKey>
  demoPersona: DemoPersona
}

export function MobileNav({ profile, enabledModules, demoPersona }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Hamburger button — only visible on mobile */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 flex items-center justify-center h-9 w-9 rounded-md border border-sidebar-border bg-sidebar text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
        aria-label="Abrir menú"
      >
        <Menu size={18} />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
      >
        {/* Close button */}
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-3 z-10 flex items-center justify-center h-7 w-7 rounded text-sidebar-foreground/40 hover:text-sidebar-foreground/80 transition-colors"
          aria-label="Cerrar menú"
        >
          <X size={16} />
        </button>

        <div onClick={() => setOpen(false)} className="h-full">
          <Sidebar
            profile={profile}
            enabledModules={enabledModules}
            demoPersona={demoPersona}
          />
        </div>
      </div>
    </>
  )
}
