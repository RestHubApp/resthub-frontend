import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router'

import { errorMessage } from '@/services/api'
import { withCustomer } from './takeawayCustomer'
import { EMPTY_TAKEAWAY, newOrderPath, takeawaySchema, type TakeawayValues } from './takeawaySchema'

/**
 * El formulario de «Para llevar»: los datos, el modo elegido y el envío.
 *
 * Al enviar guarda al cliente y lleva a la toma del pedido; si falla, deja
 * el mensaje en `failure` y los datos intactos.
 */
export function useTakeawayForm() {
  const [failure, setFailure] = useState<string | null>(null)
  const navigate = useNavigate()
  const form = useForm<TakeawayValues>({ resolver: zodResolver(takeawaySchema), defaultValues: EMPTY_TAKEAWAY })
  const mode = useWatch({ control: form.control, name: 'mode' })
  const submit = form.handleSubmit(async (values) => {
    setFailure(null)
    try {
      void navigate(newOrderPath(await withCustomer(values)))
    } catch (error) {
      setFailure(errorMessage(error, 'No se pudo guardar. Los datos siguen aquí; vuelve a intentarlo.'))
    }
  })

  return { form, mode, failure, submit }
}
