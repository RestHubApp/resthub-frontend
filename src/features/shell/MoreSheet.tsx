import { useState } from 'react'
import { useLocation } from 'react-router'

import Icon from '../../components/Icon'
import type { CurrentUserResponse } from '../../api/types'
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '../../components/ui/sheet'
import type { NavEntry } from './navigation'
import NavList from './NavList'
import SessionActions from './SessionActions'
import { TAB_ACTIVE, TAB_IDLE } from './tabStyles'

interface MoreSheetProps {
  /** Las pantallas que no entraron en la barra. */
  readonly entries: readonly NavEntry[]
  readonly account: CurrentUserResponse
}

/**
 * El ultimo boton de la barra inferior: lo que no entro y la cuenta.
 *
 * Se abre desde abajo, donde ya esta el pulgar. Si no sobra ninguna pantalla,
 * como en la cuenta de un mesero, se llama "Cuenta" porque solo lleva el
 * perfil y la salida. Se marca activo cuando la pantalla actual vive adentro.
 */
export default function MoreSheet({ entries, account }: MoreSheetProps) {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const close = () => {
    setOpen(false)
  }
  const etiqueta = entries.length > 0 ? 'Más' : 'Cuenta'
  const adentro = pathname === '/perfil' || entries.some((entry) => entry.to === pathname)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className={adentro ? TAB_ACTIVE : TAB_IDLE}
        >
          <Icon name={entries.length > 0 ? 'mas' : 'perfil'} size={22} />
          <span>{etiqueta}</span>
        </button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="max-h-[85dvh] gap-3 overflow-y-auto rounded-t-2xl px-4 pt-5 pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <SheetTitle className="m-0 px-3 font-heading text-lg font-semibold">{etiqueta}</SheetTitle>
        <SheetDescription className="sr-only">
          Otras pantallas, tu perfil y la salida.
        </SheetDescription>
        {entries.length > 0 ? <NavList entries={entries} onNavigate={close} /> : null}
        <SessionActions
          fullName={account.user.full_name}
          roleLabel={account.user.role_label}
          onNavigate={close}
        />
      </SheetContent>
    </Sheet>
  )
}
