import { useState } from 'react'

import { DEFAULT_MENU } from '@/services/appearanceRules'
import { useAppearance } from '@/store/appearance'
import { layoutMenu, type MenuLayout, moveEntry, toggleBottom } from '@/features/shell/menuLayout'
import { useAccountEntries } from '@/features/shell/useAccountEntries'
import { moveButtonId } from './moveButtonId'

interface MenuEditing {
  readonly layout: MenuLayout
  /** Lo que el lector de pantalla anuncia tras el último cambio. */
  readonly message: string
  readonly move: (index: number, step: -1 | 1) => void
  readonly toggleBar: (path: string) => void
  readonly reset: () => void
}

/**
 * Los cambios al menú de la cuenta: subir o bajar una pantalla, ponerla o sacarla
 * de la barra de abajo y volver al orden de fábrica. Cada uno se guarda al instante.
 */
export function useMenuEditing(): MenuEditing {
  const entries = useAccountEntries()
  const menu = useAppearance((state) => state.appearance.menu)
  const change = useAppearance((state) => state.change)
  const [message, setMessage] = useState('')
  const layout = layoutMenu(entries, menu)

  const move = (index: number, step: -1 | 1) => {
    const moved = layout.ordered[index]
    if (moved === undefined || layout.ordered[index + step] === undefined) {
      return
    }
    change({ menu: moveEntry(layout, index, step) })
    setMessage(`${moved.label}: lugar ${String(index + step + 1)} de ${String(layout.ordered.length)}.`)
    // Al reordenar, el navegador puede soltar el foco del botón que se tocó: se le devuelve.
    window.requestAnimationFrame(() => {
      document.getElementById(moveButtonId(moved.to, step))?.focus()
    })
  }

  const toggleBar = (path: string) => {
    change({ menu: toggleBottom(layout, path) })
  }

  const reset = () => {
    change({ menu: DEFAULT_MENU })
    setMessage('Menú restablecido al orden de siempre.')
  }

  return { layout, message, move, toggleBar, reset }
}
