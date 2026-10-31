import { Link } from 'react-router'

import type { Session } from '@/api/types'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { accountLabels } from './accountLabels'
import { Icon } from '@/components/Icon'
import * as icons from '@/components/icons'
import { Button } from '@/components/ui/button'
import { paths } from '@/services/paths'
import { usePreview } from '@/store/session'
import { pendingOrdersNotice, useSignOut } from './useSignOut'

interface SessionActionsProps {
  readonly account: Session
  readonly onNavigate?: () => void
}

/**
 * El perfil propio y la salida, al pie de la barra lateral y del panel "Más".
 *
 * En una vista previa no hay «Cerrar sesión»: se sale desde la franja de
 * arriba, que ademas descarta la sesion de la pestana.
 */
export function SessionActions({ account, onNavigate }: SessionActionsProps) {
  const { fullName, roleLabel } = accountLabels(account)
  const isPreview = usePreview()
  const { pending, signOut } = useSignOut()

  const handleSignOut = () => {
    onNavigate?.()
    signOut()
  }

  const signOutMenuItem = (onClick?: () => void) => (
    <Button type="button" variant="ghost" className="justify-start gap-3 px-3" onClick={onClick}>
      <Icon glyph={icons.signOut} size={18} />
      <span>Cerrar sesión</span>
    </Button>
  )

  const notice = pendingOrdersNotice(pending)
  const output =
    pending.length === 0 ? (
      signOutMenuItem(handleSignOut)
    ) : (
      // Los que llevan datos del cliente se descartan y los demás no salen hasta
      // que esta cuenta vuelva a entrar: quien cierra la sesion tiene que saberlo.
      <ConfirmDialog
        trigger={signOutMenuItem()}
        title={notice.title}
        description={notice.description}
        confirmLabel="Cerrar sesión"
        confirmVariant="default"
        onConfirm={handleSignOut}
      />
    )

  return (
    <div className="flex flex-col gap-1 border-t pt-3">
      <Button asChild variant="ghost" className="h-auto min-h-11 justify-start gap-3 px-3 py-2">
        <Link to={paths.profile} onClick={onNavigate}>
          <Icon glyph={icons.profile} size={18} />
          <span className="flex min-w-0 flex-col items-start leading-tight">
            <span className="max-w-full truncate">{fullName}</span>
            <span className="text-xs font-normal text-muted-foreground">{roleLabel}</span>
          </span>
        </Link>
      </Button>
      {isPreview ? null : output}
    </div>
  )
}
