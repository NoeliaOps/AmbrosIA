// Conversión entre la unidad base (de receta) de un insumo y sus presentaciones
// de compra. `factor` = cuántas unidades base equivale 1 de la presentación.

export type PurchaseUnitLike = { factor: number; whole_units: boolean }

// Necesidad en unidad base → cantidad a comprar en la presentación.
// Presentaciones "enteras" (caja, pieza) redondean hacia arriba; las fraccionables
// (kg, L a granel) conservan decimales (3).
export function purchaseFromBase(needBase: number, pu: PurchaseUnitLike): number {
  if (!pu.factor || pu.factor <= 0) return needBase
  const raw = needBase / pu.factor
  if (pu.whole_units) return Math.max(0, Math.ceil(raw - 1e-9))
  return Math.round(raw * 1000) / 1000
}

// Costo por unidad base derivado de una presentación (precio ÷ equivalencia).
export function basePriceFrom(pu: { factor: number; price: number } | null | undefined): number {
  if (!pu || !pu.factor || pu.factor <= 0) return 0
  return Math.round((pu.price / pu.factor) * 100) / 100
}
