import { useState } from 'react'

import type { StaffSession } from '@/api/types'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { pendingOrdersNotice, useSignOut } from '@/features/shell/useSignOut'
import { hasCustomerData } from '@/store/offlineQueue'
import { PasswordUnlockForm } from './PasswordUnlockForm'
import { PinUnlockForm } from './PinUnlockForm'

/**
 * La sesión bloqueada por inactividad (RFS-29).
 *
 * Tapa el armazón entero: quien encuentra el celular o la laptop sin nadie no ve
 * pedidos, clientes ni la caja. Se abre con el PIN (si la cuenta eligió uno) o
 * con la contraseña; al tercer intento equivocado la sesión se cierra.
 */
export function LockScreen({ account }: { readonly account: StaffSession }) {
  // Sin PIN solo queda la contraseña; con PIN, la persona elige.
  const [hasSwitched, setHasSwitched] = useState(false)
  const isUsingPassword = !account.has_pin || hasSwitched
  const { pending, signOut } = useSignOut()
  const notice = pendingOrdersNotice(pending)
  const exit = (onClick?: () => void) => (
    <Button type="button" variant="outline" onClick={onClick}>
      Salir
    </Button>
  )

  return (
    <main id="contenido" className="flex min-h-dvh items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-sm gap-5 py-6">
        <CardHeader className="gap-2 px-6">
          <h1 className="m-0 font-heading text-2xl font-bold">Sesión bloqueada</h1>
          <p className="m-0 text-muted-foreground">
            {`${account.user.full_name}, la sesión se bloqueó por inactividad. Desbloquéala para seguir donde estabas.`}
          </p>
        </CardHeader>
        <CardContent className="px-6">
          {isUsingPassword ? <PasswordUnlockForm /> : <PinUnlockForm />}
        </CardContent>
        <CardFooter className="flex flex-wrap justify-between gap-2 px-6">
          {account.has_pin ? (
            <Button type="button" variant="link" className="px-0" onClick={() => { setHasSwitched(!hasSwitched) }}>
              {isUsingPassword ? 'Usar mi PIN' : 'Usar mi contraseña'}
            </Button>
          ) : null}
          {/* Salir descarta los pedidos en cola con datos del cliente: se avisa antes. */}
          {pending.some(hasCustomerData) ? (
            <ConfirmDialog
              trigger={exit()}
              title={notice.title}
              description={notice.description}
              confirmLabel="Salir"
              confirmVariant="default"
              onConfirm={signOut}
            />
          ) : (
            exit(signOut)
          )}
        </CardFooter>
      </Card>
    </main>
  )
}
