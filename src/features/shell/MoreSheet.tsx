import { useState } from 'react'
import { useLocation } from 'react-router'

import { openAccessibilityMenu } from '@/components/accessibilityMenu'
import { ShellIcon } from './ShellIcon'
import { Button } from '@/components/ui/button'
import type { CurrentUserResponse } from '@/api/types'
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { paths } from '@/services/paths'
import type { NavEntry } from './navigation'
import { NavList } from './NavList'
import { SessionActions } from './SessionActions'
import { TAB_ACTIVE, TAB_IDLE } from './tabStyles'

// Lo que tarda en cerrarse el panel (la animación de `sheet`).
const SHEET_CLOSE_MS = 350

interface MoreSheetProps {
  /** Las pantallas que no entraron en la barra. */
  readonly entries: readonly NavEntry[]
  readonly account: CurrentUserResponse
}

/**
 * El ultimo boton de la barra inferior: lo que no entro, la accesibilidad y la cuenta.
 *
 * Se abre desde abajo, donde ya esta el pulgar. Si no sobra ninguna pantalla,
 * como en la cuenta de un mesero, se llama "Cuenta" porque solo lleva el
 * perfil y la salida. Se marca activo cuando la pantalla actual vive adentro.
 */
export function MoreSheet({ entries, account }: MoreSheetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { pathname } = useLocation()
  const close = () => {
    setIsOpen(false)
  }
  const label = entries.length > 0 ? 'Más' : 'Cuenta'
  const isInside = pathname === paths.profile || entries.some((entry) => entry.to === pathname)

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className={isInside ? TAB_ACTIVE : TAB_IDLE}
        >
          <ShellIcon name={entries.length > 0 ? 'more' : 'profile'} size={22} />
          <span>{label}</span>
        </button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="max-h-[85dvh] gap-3 overflow-y-auto rounded-t-2xl px-4 pt-5 pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <SheetTitle className="m-0 px-3 font-heading text-lg font-semibold">{label}</SheetTitle>
        <SheetDescription className="sr-only">
          Otras pantallas, accesibilidad, tu perfil y la salida.
        </SheetDescription>
        {entries.length > 0 ? <NavList entries={entries} onNavigate={close} /> : null}
        <Button
          type="button"
          variant="ghost"
          className="h-11 justify-start gap-3 px-3"
          onClick={() => {
            close()
            // El menú del widget se abre cuando el panel ya soltó el foco.
            window.setTimeout(openAccessibilityMenu, SHEET_CLOSE_MS)
          }}
        >
          <ShellIcon name="accessibility" size={18} />
          <span>Accesibilidad</span>
        </Button>
        <SessionActions
          fullName={account.user.full_name}
          roleLabel={account.user.role_label}
          onNavigate={close}
        />
      </SheetContent>
    </Sheet>
  )
}
