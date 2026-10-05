import { useMutation } from '@tanstack/react-query'
import { Link } from 'react-router'

import { acceptTerms, fetchCurrentUser } from '../../api/auth'
import type { CurrentUserResponse } from '../../api/types'
import FormMessage from '../../components/FormMessage'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '../../components/ui/card'
import { errorMessage, errorStatus } from '../../services/api'
import { useSession } from '../../store/session'

// La versión cambió mientras se leía: se relee la sesión y se pide la nueva.
const VERSION_CAMBIADA = 409

/**
 * Ley N.º 29733: antes de trabajar, cada cuenta acepta los términos de uso y
 * la política de privacidad vigentes. Si cambian, se vuelven a pedir.
 */
export default function TermsGate({ account }: { readonly account: CurrentUserResponse }) {
  const refresh = useSession((state) => state.refresh)
  const signOut = useSession((state) => state.signOut)
  const aceptar = useMutation({
    mutationFn: () => acceptTerms(account.terms_version),
    onSuccess: refresh,
    onError: async (error) => {
      if (errorStatus(error) === VERSION_CAMBIADA) {
        refresh(await fetchCurrentUser())
      }
    },
  })

  return (
    // Dentro del armazón, que ya tiene su <main>: una sección y no otro.
    <section aria-labelledby="terminos-titulo" className="mx-auto flex w-full max-w-xl items-center py-8">
      <Card className="w-full gap-5 py-6">
        <CardHeader className="gap-2 px-6">
          <h1 id="terminos-titulo" className="m-0 font-heading text-2xl font-bold">Antes de empezar</h1>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 px-6 leading-relaxed">
          <p className="m-0">
            {`Hola, ${account.user.full_name}. En RestHub vas a trabajar con datos personales de clientes, como su teléfono, su dirección o sus alergias. La Ley N.º 29733 pide que los uses solo para atender al restaurante y que los cuides.`}
          </p>
          <p className="m-0">
            <Link to="/privacidad" target="_blank" className="inline-flex min-h-11 items-center underline underline-offset-4">
              {`Leer los términos de uso y la política de privacidad (versión ${account.terms_version})`}
            </Link>
          </p>
          {aceptar.isError ? (
            <FormMessage tone="error">{errorMessage(aceptar.error, 'No se pudo guardar. Vuelve a intentarlo.')}</FormMessage>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-wrap justify-end gap-2 px-6">
          <Button type="button" variant="outline" size="lg" className="h-11 px-4" onClick={signOut}>
            Salir
          </Button>
          <Button
            type="button"
            size="lg"
            className="h-11 px-4"
            disabled={aceptar.isPending}
            onClick={() => {
              aceptar.mutate()
            }}
          >
            {aceptar.isPending ? 'Guardando…' : 'Acepto los términos'}
          </Button>
        </CardFooter>
      </Card>
    </section>
  )
}
