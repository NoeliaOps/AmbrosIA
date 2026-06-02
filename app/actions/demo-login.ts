"use server"

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { DEMO_COOKIE, type DemoPersona } from "@/lib/demo"

export async function enterDemo(persona: DemoPersona): Promise<{ error: string }> {
  const email = process.env.SUPABASE_DEMO_EMAIL
  const password = process.env.SUPABASE_DEMO_PASSWORD

  if (!email || !password) {
    return { error: "El acceso demo no está configurado en este entorno." }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: "No se pudo acceder al demo. Intenta de nuevo." }
  }

  const cookieStore = await cookies()
  cookieStore.set(DEMO_COOKIE, persona, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  })

  redirect("/")
}
