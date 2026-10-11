import { useState } from 'react'

import { type Selected, toggle } from './modifierSelection'

/**
 * Las opciones que el mesero va eligiendo en el dialogo de un plato.
 *
 * Guarda lo elegido y si el ultimo intento de agregar fallo; al fallar las
 * opciones siguen elegidas para reintentar, y al agregar con exito se limpian.
 */
export function useModifierChoices() {
  const [selected, setSelected] = useState<Selected>({})
  const [hasFailure, setHasFailure] = useState(false)

  const choose = (group: string, option: string, max: number) => {
    setSelected((before) => toggle({ selected: before, group, option, max }))
  }
  const reset = () => {
    setSelected({})
  }
  /** Registra el resultado de agregar el plato: `false` es un fallo. */
  const settle = (accepted: boolean | undefined) => {
    if (accepted === false) {
      setHasFailure(true)
      return
    }
    setHasFailure(false)
    setSelected({})
  }
  return { selected, hasFailure, choose, reset, settle }
}
