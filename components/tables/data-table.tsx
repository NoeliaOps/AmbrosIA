"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

export type Column<T> = {
  key: keyof T | string
  header: string
  cell?: (row: T) => React.ReactNode
  className?: string
  sortable?: boolean
}

type DataTableProps<T extends Record<string, unknown>> = {
  data: T[]
  columns: Column<T>[]
  searchPlaceholder?: string
  searchKeys?: (keyof T)[]
  actions?: React.ReactNode
  emptyState?: React.ReactNode
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  searchPlaceholder = "Buscar...",
  searchKeys,
  actions,
  emptyState,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("")
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

  const filtered = search && searchKeys
    ? data.filter((row) =>
        searchKeys.some((key) =>
          String(row[key] ?? "").toLowerCase().includes(search.toLowerCase())
        )
      )
    : data

  const sorted = sortKey
    ? [...filtered].sort((a, b) => {
        const aVal = String(a[sortKey] ?? "")
        const bVal = String(b[sortKey] ?? "")
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      })
    : filtered

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        {searchKeys && (
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 font-sans"
            />
          </div>
        )}
        {actions && <div className="flex items-center gap-2 ml-auto">{actions}</div>}
      </div>

      {/* Table */}
      <div className="rounded-md border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              {columns.map((col) => (
                <TableHead
                  key={String(col.key)}
                  className={cn(
                    "font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                    col.sortable && "cursor-pointer select-none hover:text-foreground",
                    col.className
                  )}
                  onClick={col.sortable ? () => toggleSort(String(col.key)) : undefined}
                >
                  {col.header}
                  {col.sortable && sortKey === String(col.key) && (
                    <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  {emptyState ?? (
                    <span className="text-sm text-muted-foreground font-sans">
                      {search ? "Sin resultados para tu búsqueda." : "Sin registros."}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((row, i) => (
                <TableRow key={i} className="hover:bg-muted/20">
                  {columns.map((col) => (
                    <TableCell
                      key={String(col.key)}
                      className={cn("font-sans text-sm py-3", col.className)}
                    >
                      {col.cell
                        ? col.cell(row)
                        : String(row[col.key as keyof T] ?? "—")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {sorted.length > 0 && (
        <p className="text-xs text-muted-foreground font-sans">
          {sorted.length} {sorted.length === 1 ? "registro" : "registros"}
          {search && ` de ${data.length}`}
        </p>
      )}
    </div>
  )
}
