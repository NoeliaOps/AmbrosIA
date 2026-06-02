"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { MODULE_REGISTRY, type ModuleKey } from "@/lib/modules"

export function useModules() {
  const [enabledModules, setEnabledModules] = useState<Set<ModuleKey>>(
    () => new Set(
      (Object.entries(MODULE_REGISTRY) as [ModuleKey, typeof MODULE_REGISTRY[ModuleKey]][])
        .filter(([, m]) => m.defaultEnabled)
        .map(([key]) => key)
    )
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    supabase
      .from("module_settings")
      .select("module_key, is_enabled")
      .then(({ data: rawData }) => {
        type ModuleRow = { module_key: string; is_enabled: boolean }
        const data = rawData as ModuleRow[] | null
        if (data && data.length > 0) {
          const enabled = new Set<ModuleKey>(
            data
              .filter((row) => row.is_enabled)
              .map((row) => row.module_key as ModuleKey)
          )
          setEnabledModules(enabled)
        }
        setLoading(false)
      })
  }, [])

  function isEnabled(key: ModuleKey) {
    return enabledModules.has(key)
  }

  return { enabledModules, isEnabled, loading }
}
