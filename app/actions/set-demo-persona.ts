"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
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
  // Al cambiar de rol, llevar al dashboard (siempre permitido) para que la nueva
  // restricción de acceso aplique de inmediato y no quede una página no permitida.
  redirect("/")
}
