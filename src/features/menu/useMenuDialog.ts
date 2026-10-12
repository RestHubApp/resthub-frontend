import { useState } from 'react'

import { useScreenAction } from '@/hooks/useScreenAction'
import type { NewMenuDialog } from './NewMenuDialogs'

function requestedDialog(isDish: boolean, isCategory: boolean): NewMenuDialog {
  if (isDish) {
    return { type: 'plato' }
  }
  return isCategory ? { type: 'categoria' } : null
}

/**
 * Qué ventana de alta de la carta está abierta: la que pidió un botón o la
 * dirección (`?accion=nuevo-plato`, `?accion=nueva-categoria`).
 */
export function useMenuDialog() {
  const [dialog, setDialog] = useState<NewMenuDialog>(null)
  const newDish = useScreenAction('nuevo-plato')
  const newCategory = useScreenAction('nueva-categoria')

  return {
    dialog: dialog ?? requestedDialog(newDish.isRequested, newCategory.isRequested),
    open: (fresh: NewMenuDialog) => () => {
      setDialog(fresh)
    },
    close: () => {
      setDialog(null)
      newDish.clear()
      newCategory.clear()
    },
  }
}
