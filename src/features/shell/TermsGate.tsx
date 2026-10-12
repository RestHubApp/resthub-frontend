import { useState } from 'react'

import { ErrorMessage } from '@/components/ErrorMessage'
import type { StaffSession } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { useSession } from '@/store/session'
import { TermsConsents } from './TermsConsents'
import { useAcceptTerms } from './useAcceptTerms'

/**
 * Ley N.º 29733: antes de trabajar, cada cuenta da dos consentimientos
 * separados y sin marcar de antemano: los términos y condiciones del servicio, y
 * el tratamiento de sus datos personales. Si cambia el texto de alguno, se vuelven a pedir.
 */
export function TermsGate({ account }: { readonly account: StaffSession }) {
  const signOut = useSession((state) => state.signOut)
  const accept = useAcceptTerms({ terms_version: account.terms_version, privacy_version: account.privacy_version })
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false)
  const [hasAcceptedData, setHasAcceptedData] = useState(false)

  return (
    // Dentro del armazón, que ya tiene su <main>: una sección y no otro.
    <section aria-labelledby="terminos-titulo" className="mx-auto flex w-full max-w-xl items-center py-8">
      <Card className="w-full gap-5 py-6">
        <CardHeader className="gap-2 px-6">
          <h1 id="terminos-titulo" className="m-0 font-heading text-2xl font-bold">Antes de empezar</h1>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 px-6 leading-relaxed">
          <p className="m-0">
            {`Hola, ${account.user.full_name}. En RestHub vas a trabajar con datos personales de clientes, como su teléfono, su dirección o sus alergias. La Ley N.º 29733 pide que los uses solo para atender al restaurante y que los cuides. Acepta cada punto por separado.`}
          </p>
          <TermsConsents
            account={account}
            hasAcceptedTerms={hasAcceptedTerms}
            hasAcceptedData={hasAcceptedData}
            onTermsChange={setHasAcceptedTerms}
            onDataChange={setHasAcceptedData}
          />
          {accept.isError ? (
            <ErrorMessage error={accept.error} fallback="No se pudo guardar. Vuelve a intentarlo." />
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-wrap justify-end gap-2 px-6">
          <Button type="button" variant="outline" onClick={signOut}>
            Salir
          </Button>
          <Button
            type="button"
            disabled={accept.isPending || !hasAcceptedTerms || !hasAcceptedData}
            onClick={() => {
              accept.mutate()
            }}
          >
            {accept.isPending ? 'Guardando…' : 'Continuar'}
          </Button>
        </CardFooter>
      </Card>
    </section>
  )
}
