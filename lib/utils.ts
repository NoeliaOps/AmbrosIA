import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("es-MX", options ?? { dateStyle: "long" }).format(d)
}

export function formatShortDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d)
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

// ── Semana ISO (lunes-domingo) ────────────────────────────────────────────────
// Devuelve la fecha (YYYY-MM-DD) del LUNES de la semana que contiene `dateStr`.
// Se usa como clave para prorratear costos semanales entre los eventos de la semana.
export function weekStartKey(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00")
  const dow = (d.getDay() + 6) % 7 // 0 = lunes … 6 = domingo
  d.setDate(d.getDate() - dow)
  return d.toISOString().slice(0, 10)
}

// Etiqueta legible de una semana a partir de su lunes: "9–15 jun 2026".
export function weekLabel(mondayKey: string): string {
  const mon = new Date(mondayKey + "T12:00:00")
  const sun = new Date(mon)
  sun.setDate(sun.getDate() + 6)
  const sameMonth = mon.getMonth() === sun.getMonth()
  const dM = (d: Date) => d.toLocaleDateString("es-MX", { day: "numeric", month: "short" })
  const left = sameMonth ? String(mon.getDate()) : dM(mon)
  return `${left}–${dM(sun)} ${sun.getFullYear()}`
}

// Google Calendar "add event" URL — opens pre-filled in a new tab, no OAuth needed
export function googleCalendarEventUrl(params: {
  title: string
  startDate: string       // YYYY-MM-DD
  endDate?: string        // YYYY-MM-DD (exclusive for all-day); defaults to startDate + 1 day
  startTime?: string      // HH:MM (24h, local)
  endTime?: string        // HH:MM (24h, local)
  location?: string
  details?: string
}): string {
  const pad = (n: number) => String(n).padStart(2, "0")

  let dates: string
  if (params.startTime) {
    // timed event — format as YYYYMMDDTHHmmss (no Z = local time)
    const [sh, sm] = params.startTime.split(":").map(Number)
    const [eh, em] = (params.endTime ?? params.startTime).split(":").map(Number)
    const [sy, smo, sd] = params.startDate.split("-").map(Number)
    const [ey, emo, ed] = (params.endDate ?? params.startDate).split("-").map(Number)
    const start = `${sy}${pad(smo)}${pad(sd)}T${pad(sh)}${pad(sm)}00`
    const end = `${ey}${pad(emo)}${pad(ed)}T${pad(eh)}${pad(em)}00`
    dates = `${start}/${end}`
  } else {
    // all-day event — format as YYYYMMDD/YYYYMMDD (end is exclusive)
    const endDate = params.endDate ?? (() => {
      const d = new Date(params.startDate + "T12:00:00")
      d.setDate(d.getDate() + 1)
      return d.toISOString().slice(0, 10)
    })()
    const fmt = (s: string) => s.replace(/-/g, "")
    dates = `${fmt(params.startDate)}/${fmt(endDate)}`
  }

  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: params.title,
    dates,
    ...(params.location ? { location: params.location } : {}),
    ...(params.details ? { details: params.details } : {}),
  })
  return `https://calendar.google.com/calendar/render?${q.toString()}`
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
}
