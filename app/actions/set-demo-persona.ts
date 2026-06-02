"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { DEMO_COOKIE, type DemoPersona } from "@/lib/demo"

export async function setDemoPersona(persona: DemoPersona) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const cookieStore = await cookies()
  cookieStore.set(DEMO_COOKIE, persona, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  })
  revalidatePath("/", "layout")
}
