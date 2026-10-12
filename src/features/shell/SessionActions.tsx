import { Link, useNavigate } from 'react-router'

import type { Session } from '@/api/types'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { accountLabels } from './accountLabels'
import { ShellIcon } from './ShellIcon'
import { Button } from '@/components/ui/button'
import { paths } from '@/services/paths'
import { useQueuedOrders } from '@/store/offlineQueue'
import { usePreview, useSession, useStaffAccount } from '@/store/session'

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
  const signOut = useSession((state) => state.signOut)
  const isPreview = usePreview()
  const pending = useQueuedOrders(useStaffAccount())
  const navigate = useNavigate()

  const handleSignOut = () => {
    onNavigate?.()
    // Se vacia la sesion y se va al acceso en el mismo evento: React aplica
    // los dos cambios juntos, asi que ninguna pantalla privada llega a
    // dibujarse sin cuenta.
    signOut()
    void navigate(paths.login, { replace: true })
  }

  const howMany =
    pending.length === 1 ? 'Un pedido tuyo espera' : `${String(pending.length)} pedidos tuyos esperan`
  const signOutMenuItem = (onClick?: () => void) => (
    <Button type="button" variant="ghost" className="justify-start gap-3 px-3" onClick={onClick}>
      <ShellIcon name="signOut" size={18} />
      <span>Cerrar sesión</span>
    </Button>
  )

  const output =
    pending.length === 0 ? (
      signOutMenuItem(handleSignOut)
    ) : (
      // Los pedidos no se borran, pero no salen hasta que esta cuenta vuelva
      // a entrar: quien cierra la sesion tiene que saberlo.
      <ConfirmDialog
        trigger={signOutMenuItem()}
        title="¿Cerrar sesión con pedidos sin enviar?"
        description={`${howMany} señal: ${pending.map((order) => order.label).join(', ')}. Quedan guardados en este celular y se envían cuando vuelvas a entrar con tu cuenta.`}
        confirmLabel="Cerrar sesión"
        confirmVariant="default"
        onConfirm={handleSignOut}
      />
    )

  return (
    <div className="flex flex-col gap-1 border-t pt-3">
      <Button asChild variant="ghost" className="h-auto min-h-11 justify-start gap-3 px-3 py-2">
        <Link to={paths.profile} onClick={onNavigate}>
          <ShellIcon name="profile" size={18} />
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
