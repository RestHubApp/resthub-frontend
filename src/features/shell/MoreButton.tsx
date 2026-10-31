import type { ComponentPropsWithRef } from 'react'

import { EntryBadge } from './EntryBadge'
import type { NavEntry } from './navigation'
import { Icon } from '@/components/Icon'
import * as icons from '@/components/icons'
import { TAB_ACTIVE, TAB_IDLE } from './tabStyles'

type MoreButtonProps = Readonly<ComponentPropsWithRef<'button'>> & {
  /** Lo que quedó en «Más»: su contador (las mermas por aprobar) se ve sobre el botón. */
  readonly entries: readonly NavEntry[]
  readonly label: string
  /** La pantalla actual vive adentro: el botón se marca como la actual. */
  readonly isInside: boolean
}

/** El último casillero de la barra de abajo. `SheetTrigger` le pasa sus propiedades y su ref. */
export function MoreButton({ entries, label, isInside, ...trigger }: MoreButtonProps) {
  return (
    <button type="button" {...trigger} className={isInside ? TAB_ACTIVE : TAB_IDLE}>
      <Icon glyph={entries.length > 0 ? icons.more : icons.profile} size={22} />
      <span>{label}</span>
      {entries.map((entry) => (
        <EntryBadge key={entry.to} entry={entry} isFloating />
      ))}
    </button>
  )
}
