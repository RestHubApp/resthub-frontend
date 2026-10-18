import type { Session } from '@/api/types'
import { OwnAccessCard } from './OwnAccessCard'
import { OwnSessionsCard } from './OwnSessionsCard'
import { PinCard } from './PinCard'
import { TwoFactorCard } from './TwoFactorCard'

/**
 * La seguridad de la cuenta en «Mi perfil»: las sesiones abiertas, los
 * accesos, la verificación en dos pasos y, en el personal, el bloqueo con PIN. La vista
 * previa no tiene nada de esto: la cuenta de muestra no es de nadie.
 */
export function AccountSecurity({ account }: { readonly account: Session }) {
  if (account.preview) return null
  return (
    <>
      <OwnSessionsCard />
      <OwnAccessCard />
      <TwoFactorCard />
      {account.kind === 'staff' ? <PinCard /> : null}
    </>
  )
}
