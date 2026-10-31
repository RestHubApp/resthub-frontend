import type { IconGlyph } from '@/components/Icon'
import * as icons from '@/components/icons'

/** Las secciones del inventario, en el orden de las pestañas. */
export type InventorySection = 'insumos' | 'movimientos' | 'conteos' | 'recetas' | 'compras' | 'proveedores'

export const SECTIONS: readonly { readonly value: InventorySection; readonly label: string; readonly icon: IconGlyph }[] = [
  { value: 'insumos', label: 'Insumos', icon: icons.inventory },
  { value: 'movimientos', label: 'Movimientos', icon: icons.movements },
  { value: 'conteos', label: 'Conteos', icon: icons.count },
  { value: 'recetas', label: 'Recetas', icon: icons.recipe },
  { value: 'compras', label: 'Compras', icon: icons.purchase },
  { value: 'proveedores', label: 'Proveedores', icon: icons.restaurant },
]
