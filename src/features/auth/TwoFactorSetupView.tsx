import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

import { reportSignOut } from '@/api/auth'
import { twoFactorQuery } from '@/api/twoFactor'
import type { Session } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { useSession } from '@/store/session'
import { TwoFactorCard } from './security/TwoFactorCard'

/** Por qué se pide: la plataforma o la administración del personal del local. */
function reasonFor(account: Session): string {
  if (account.kind === 'platform') {
    return `${account.admin.full_name}, la administración del sistema pide además de la contraseña un código de tu celular. Actívala para seguir.`
  }
  return `${account.user.full_name}, quien administra el personal del local entra con la contraseña y un código de su celular. Actívala para seguir.`
}

/**
 * La administración del sistema y quien administra el personal de un local no
 * trabajan sin la verificación en dos pasos (RFS-22): con la contraseña sola se
 * podría dar de alta un restaurante, entrar a la vista previa de cualquiera o
 * crear cuentas y cambiar contraseñas del local. Hasta activarla, esta pantalla
 * tapa el armazón; al confirmar el primer código, la aplicación se abre.
 */
export function TwoFactorSetupView({ account }: { readonly account: Session }) {
  const status = useQuery(twoFactorQuery)
  const isEnabled = status.data?.enabled === true

  useEffect(() => {
    if (isEnabled) useSession.getState().refresh({ ...account, two_factor_setup_required: false })
  }, [isEnabled, account])

  const signOut = () => {
    const { token } = useSession.getState()
    void reportSignOut(token)
    useSession.getState().signOut()
  }

  return (
    <main id="contenido" className="flex min-h-dvh items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-lg gap-5 py-6">
        <CardHeader className="gap-2 px-6">
          <h1 className="m-0 font-heading text-2xl font-bold">Activa la verificación en dos pasos</h1>
          <p className="m-0 text-muted-foreground">{reasonFor(account)}</p>
        </CardHeader>
        <CardContent className="px-6">
          <TwoFactorCard canDisable={false} />
        </CardContent>
        <CardFooter className="flex justify-end px-6">
          <Button type="button" variant="outline" onClick={signOut}>
            Salir
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}
