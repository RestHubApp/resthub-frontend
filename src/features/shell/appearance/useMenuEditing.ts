import { useState } from 'react'

import { BOTTOM_BAR_SLOTS } from '@/services/appearanceRules'
import { useAppearance } from '@/store/appearance'
import { layoutMenu, type MenuGroup, type MenuLayout, reorderWithin, toggleBottom } from '@/features/shell/menuLayout'
import { useAccountEntries } from '@/features/shell/useAccountEntries'
import { menuActionsId } from './menuActionsId'

interface MenuEditing {
  readonly layout: MenuLayout
  readonly isBarFull: boolean
  /** Lo que el lector de pantalla anuncia tras el último cambio. */
  readonly message: string
  /** Mueve una pantalla a otro lugar de su grupo (al arrastrarla). */
  readonly reorder: (group: MenuGroup, from: number, to: number) => void
  /** Sube (`-1`) o baja (`1`) una pantalla un lugar dentro de su grupo. */
  readonly step: (group: MenuGroup, index: number, step: -1 | 1) => void
  readonly toggleBar: (path: string) => void
}

const WHERE = { bar: 'en la barra de abajo', rest: 'en «Más»' } as const

/**
 * Al reordenar, el navegador suelta el foco del botón que se tocó: se le devuelve.
 *
 * Son dos cuadros: el cambio de lugar se pinta en el siguiente, y solo después
 * el botón ya está en su sitio nuevo.
 */
function refocus(path: string): void {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      document.getElementById(menuActionsId(path))?.focus()
    })
  })
}

/**
 * Los cambios al menú de la cuenta: mover una pantalla dentro de su grupo (con
 * «⋯» o arrastrando), ponerla o sacarla de la barra de abajo.
 * Cada uno se guarda al instante y se anuncia.
 */
export function useMenuEditing(): MenuEditing {
  const entries = useAccountEntries()
  const menu = useAppearance((state) => state.appearance.menu)
  const change = useAppearance((state) => state.change)
  const [message, setMessage] = useState('')
  const layout = layoutMenu(entries, menu)

  const reorder = (group: MenuGroup, from: number, to: number) => {
    const members = group === 'bar' ? layout.bar : layout.rest
    const moved = members[from]
    const next = reorderWithin(layout, { group, from, to })
    if (moved === undefined || next === null) {
      return
    }
    change({ menu: next })
    setMessage(`${moved.label}: lugar ${String(to + 1)} de ${String(members.length)} ${WHERE[group]}.`)
  }

  const step = (group: MenuGroup, index: number, direction: -1 | 1) => {
    const moved = (group === 'bar' ? layout.bar : layout.rest)[index]
    reorder(group, index, index + direction)
    if (moved !== undefined) {
      refocus(moved.to)
    }
  }

  const toggleBar = (path: string) => {
    const entry = layout.ordered.find((candidate) => candidate.to === path)
    const wasInBar = layout.bar.some((candidate) => candidate.to === path)
    change({ menu: toggleBottom(layout, path) })
    if (entry !== undefined) {
      setMessage(`${entry.label} ${wasInBar ? 'salió de la barra de abajo y quedó en «Más»' : 'entró en la barra de abajo'}.`)
      refocus(path)
    }
  }

  return { layout, isBarFull: layout.bar.length >= BOTTOM_BAR_SLOTS, message, reorder, step, toggleBar }
}
