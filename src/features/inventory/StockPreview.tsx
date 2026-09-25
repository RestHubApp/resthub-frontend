import type { Ingredient } from '../../api/types'
import { formatQuantity } from './units'

interface StockPreviewProps {
  readonly ingredient: Ingredient
  /** El cambio en la unidad base, o `null` si todavía no se puede calcular. */
  readonly delta: number | null
}

/**
 * Cómo queda el stock si se guarda: "Hoy hay 150 g → quedará en 5.15 kg".
 *
 * Sin punto final: "12 unid." ya trae el suyo.
 *
 * Se anuncia con cortesía mientras se escribe, sin interrumpir.
 */
export default function StockPreview({ ingredient, delta }: StockPreviewProps) {
  const actual = Number(ingredient.stock)
  const quedara = delta === null ? null : actual + delta
  const minimo = Number(ingredient.min_stock)

  return (
    <p aria-live="polite" className="m-0 rounded-lg bg-muted px-3 py-2 text-sm">
      Hoy hay <strong>{formatQuantity(actual, ingredient.unit)}</strong>
      {quedara === null ? null : (
        <>
          {' '}→ quedará en <strong>{formatQuantity(quedara, ingredient.unit)}</strong>
          {quedara < minimo ? ', todavía bajo el mínimo' : null}
        </>
      )}
    </p>
  )
}
