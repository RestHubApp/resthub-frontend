import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { pendingOrdersNotice, useSignOut } from './useSignOut'

/**
 * «Salir» de la puerta de los términos: la misma salida que «Cerrar sesión».
 * Cierra la sesión en el servidor, descarta los pedidos sin enviar que llevan
 * datos del cliente y, si hay pedidos pendientes, lo avisa antes.
 */
export function TermsSignOut() {
  const { pending, signOut } = useSignOut()
  const button = (onClick?: () => void) => (
    <Button type="button" variant="outline" onClick={onClick}>
      Salir
    </Button>
  )
  if (pending.length === 0) return button(() => { signOut() })
  const notice = pendingOrdersNotice(pending)
  return (
    <ConfirmDialog
      trigger={button()}
      title={notice.title}
      description={notice.description}
      confirmLabel="Salir"
      confirmVariant="default"
      onConfirm={() => { signOut() }}
    />
  )
}
