import type { IconName } from '@/components/icons'

/** Las secciones del inventario, en el orden de las pestañas. */
export type InventorySection = 'insumos' | 'movimientos' | 'recetas' | 'compras' | 'proveedores'

export const SECTIONS: readonly { readonly value: InventorySection; readonly label: string; readonly icon: IconName }[] = [
  { value: 'insumos', label: 'Insumos', icon: 'inventory' },
  { value: 'movimientos', label: 'Movimientos', icon: 'movements' },
  { value: 'recetas', label: 'Recetas', icon: 'recipe' },
  { value: 'compras', label: 'Compras', icon: 'purchase' },
  { value: 'proveedores', label: 'Proveedores', icon: 'restaurant' },
]
