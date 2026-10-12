import { useSearchParams } from 'react-router'

import { type InventorySection, SECTIONS } from './inventorySections'

function sectionOf(value: string | null): InventorySection {
  return SECTIONS.find((section) => section.value === value)?.value ?? 'insumos'
}

/**
 * La pestaña abierta del inventario, guardada en la dirección (`?vista=recetas`).
 *
 * Volver desde el editor de una receta deja a la persona donde estaba.
 */
export function useInventorySection() {
  const [params, setParams] = useSearchParams()
  const section = sectionOf(params.get('vista'))
  const setSection = (fresh: InventorySection) => {
    setParams(fresh === 'insumos' ? {} : { 'vista': fresh }, { replace: true })
  }

  return [section, setSection] as const
}
