import { useMutationState, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { reportSignOut } from '@/api/auth'
import { twoFactorConfirmKey, twoFactorQuery } from '@/api/twoFactor'
import type { PlatformSession } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { useSession } from '@/store/session'
import { TwoFactorCard } from './security/TwoFactorCard'

/**
 * La administración del sistema no usa la plataforma sin la verificación en dos
 * pasos (RFS-22): con la contraseña sola se podría dar de alta un restaurante o
 * entrar a la vista previa de cualquiera. Hasta activarla, esta pantalla tapa el
 * armazón. Al confirmar el primer código se muestran los códigos de
 * recuperación, que no se vuelven a ver: la plataforma se abre recién con «Ya
 * los guardé». Si ya estaba activa al llegar, se abre enseguida.
 */
export function TwoFactorSetupView({ account }: { readonly account: PlatformSession }) {
  const status = useQuery(twoFactorQuery)
  const isEnabled = status.data?.enabled === true
  // Una confirmación en esta pantalla deja los códigos a la vista: el estado releído no abre la plataforma.
  const confirmations = useMutationState({ filters: { mutationKey: twoFactorConfirmKey } }).length
  const queryClient = useQueryClient()
  const openPlatform = () => {
    // Ya se vieron los códigos: la confirmación deja de sostener el alta (ver AccountSetupGate).
    const mutations = queryClient.getMutationCache()
    for (const mutation of mutations.findAll({ mutationKey: twoFactorConfirmKey })) mutations.remove(mutation)
    useSession.getState().refresh({ ...account, two_factor_setup_required: false })
  }

  useEffect(() => {
    if (isEnabled && confirmations === 0) useSession.getState().refresh({ ...account, two_factor_setup_required: false })
  }, [isEnabled, confirmations, account])

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
          <p className="m-0 text-muted-foreground">
            {`${account.admin.full_name}, la administración del sistema pide además de la contraseña un código de tu celular. Actívala para seguir.`}
          </p>
        </CardHeader>
        <CardContent className="px-6">
          <TwoFactorCard canDisable={false} onEnabled={openPlatform} />
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
