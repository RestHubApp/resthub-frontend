import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router'

import { isCurrentEntry, type NavEntry } from './navigation'
import { useScreenPreload } from './shellScreens'

interface EntryLinkProps {
  readonly entry: NavEntry
  /** Las clases según la entrada sea la pantalla actual o no. */
  readonly className: (isCurrent: boolean) => string
  readonly onClick?: (() => void) | undefined
  readonly children: ReactNode
}

/**
 * Un enlace del menú que adelanta el archivo y los datos de su pantalla.
 *
 * Marca la pantalla actual con `aria-current` (el lector la anuncia sin
 * depender del color); la regla de qué es «actual» es `isCurrentEntry`.
 */
export function EntryLink({ entry, className, onClick, children }: EntryLinkProps) {
  const handlers = useScreenPreload(entry.to)
  const isCurrent = isCurrentEntry(entry, useLocation().pathname)
  return (
    <Link {...handlers} to={entry.to} className={className(isCurrent)} aria-current={isCurrent ? 'page' : undefined} onClick={onClick}>
      {children}
    </Link>
  )
}
