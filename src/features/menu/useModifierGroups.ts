import { useState } from 'react'

import type { MenuItem } from '@/api/types'
import { draftsOf, type GroupDraft, type ParsedGroup, parseGroups } from './modifierDrafts'

/**
 * Los grupos de opciones que se editan en el formulario del plato.
 *
 * `collect` valida los borradores: devuelve los grupos listos para enviar, o
 * `null` y deja el motivo en `error`.
 */
export function useModifierGroups(item: MenuItem | undefined) {
  const [groups, setGroups] = useState<GroupDraft[]>(() => draftsOf(item))
  const [error, setError] = useState<string | null>(null)

  const collect = (): ParsedGroup[] | null => {
    const options = parseGroups(groups)
    if (!options.ok) {
      setError(options.error)
      return null
    }
    setError(null)
    return options.value
  }

  return { groups, setGroups, error, collect }
}
