import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { MODULE_REGISTRY, type ModuleKey } from "@/lib/modules"
import { DEMO_COOKIE, getPersona } from "@/lib/demo"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role")
    .eq("id", user.id)
    .single()

  const { data: rawModuleRows } = await supabase
    .from("module_settings")
    .select("module_key, is_enabled")

  type ModuleRow = { module_key: string; is_enabled: boolean }
  const moduleRows = rawModuleRows as ModuleRow[] | null

  const enabledModules: Set<ModuleKey> = new Set(
    moduleRows && moduleRows.length > 0
      ? moduleRows.filter((r) => r.is_enabled).map((r) => r.module_key as ModuleKey)
      : (Object.entries(MODULE_REGISTRY) as [ModuleKey, typeof MODULE_REGISTRY[ModuleKey]][])
          .filter(([, m]) => m.defaultEnabled)
          .map(([key]) => key)
  )

  const cookieStore = await cookies()
  const demoPersona = getPersona(cookieStore.get(DEMO_COOKIE)?.value)

  const sidebarProps = {
    profile: profile ?? { full_name: null, email: user.email ?? "", role: "admin" as const },
    enabledModules,
    demoPersona,
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden lg:flex">
        <Sidebar {...sidebarProps} />
      </div>

      {/* Mobile nav drawer */}
      <MobileNav {...sidebarProps} />

      <main className="flex-1 overflow-y-auto">
        <div className="p-4 pt-16 lg:pt-6 md:p-8 max-w-screen-2xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
