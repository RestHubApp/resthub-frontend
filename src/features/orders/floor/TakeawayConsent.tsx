import { Controller, type UseFormReturn, useWatch } from 'react-hook-form'

import ConsentField from '../../../components/ConsentField'
import type { TakeawayValues } from './takeawaySchema'

/**
 * El consentimiento del cliente nuevo de un delivery. Sin marcarlo, el pedido
 * sale igual y el cliente no queda en la libreta.
 */
export default function TakeawayConsent({ form }: { readonly form: UseFormReturn<TakeawayValues> }) {
  const [mode, customerId] = useWatch({ control: form.control, name: ['mode', 'customer_id'] })
  if (mode !== 'delivery' || customerId !== null) {
    return null
  }
  return (
    <Controller
      control={form.control}
      name="consent"
      render={({ field }) => <ConsentField id="takeaway-consent" checked={field.value} onChange={field.onChange} />}
    />
  )
}
