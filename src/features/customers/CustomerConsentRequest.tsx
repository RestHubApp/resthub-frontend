import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { customerQuery, customersQueryKey, saveCustomer } from '@/api/customers'
import type { Customer } from '@/api/types'
import { ConsentField } from '@/components/ConsentField'
import { ErrorMessage } from '@/components/ErrorMessage'
import { Button } from '@/components/ui/button'
import { useNotifications } from '@/store/notifications'
import { customerDefaults, customerRequest } from './customerSchema'

interface CustomerConsentRequestProps {
  /** El cliente de la ficha; si ya dio su consentimiento, no se dibuja nada. */
  readonly customer: Customer
}

/**
 * La casilla del consentimiento en la ficha de un cliente que no lo tiene
 * registrado (RFP-02): se le pide al abrirla, sin pasar por «Editar datos».
 * Se guardan sus mismos datos con `consent: true` y la ficha muestra lo que
 * devolvió el servidor: con el consentimiento anotado, la casilla desaparece.
 */
export function CustomerConsentRequest({ customer }: CustomerConsentRequestProps) {
  const queryClient = useQueryClient()
  const push = useNotifications((state) => state.push)
  const [isChecked, setIsChecked] = useState(false)
  const [isMissing, setIsMissing] = useState(false)
  const save = useMutation({
    mutationFn: () => saveCustomer(customerRequest({ ...customerDefaults(customer), consent: true }), customer.id),
    onSuccess: async (saved) => {
      queryClient.setQueryData(customerQuery(customer.id).queryKey, saved)
      await queryClient.invalidateQueries({ queryKey: customersQueryKey })
      push({ tone: 'info', message: `${saved.name}: consentimiento registrado.` })
    },
  })

  if (customer.consent_at !== null) {
    return null
  }
  return (
    <section aria-labelledby="consentimiento-titulo" className="flex flex-col gap-2 border-t pt-4">
      <h3 id="consentimiento-titulo" className="m-0 text-sm font-semibold">Pedirle su consentimiento</h3>
      <ConsentField
        id="customer-consent-request"
        checked={isChecked}
        onChange={(value) => {
          setIsChecked(value)
          setIsMissing(false)
        }}
        error={isMissing ? 'Marca la casilla solo si el cliente acepta.' : undefined}
      />
      {save.error === null ? null : <ErrorMessage error={save.error} fallback="No se pudo registrar el consentimiento." />}
      <Button
        type="button"
        disabled={save.isPending}
        onClick={() => {
          if (isChecked) {
            save.mutate()
          } else {
            setIsMissing(true)
          }
        }}
      >
        {save.isPending ? 'Guardando…' : 'Registrar consentimiento'}
      </Button>
    </section>
  )
}
