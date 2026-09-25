import type { IconName } from '../../components/icons'

/** Las secciones del inventario, en el orden de las pestañas. */
export type InventorySection = 'insumos' | 'movimientos' | 'alertas' | 'recetas'

export const SECTIONS: readonly { readonly value: InventorySection; readonly label: string; readonly icon: IconName }[] = [
  { value: 'insumos', label: 'Insumos', icon: 'inventario' },
  { value: 'movimientos', label: 'Movimientos', icon: 'movimientos' },
  { value: 'alertas', label: 'Alertas', icon: 'aviso' },
  { value: 'recetas', label: 'Recetas', icon: 'receta' },
]
