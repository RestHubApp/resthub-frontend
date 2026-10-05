import { type Control, Controller, type FieldErrors } from 'react-hook-form'

import type { Customer } from '../../api/types'
import ConsentField from '../../components/ConsentField'
import { formatDateTime } from '../../services/format'
import { useTimeZone } from '../../store/session'
import type { CustomerValues } from './customerSchema'

interface CustomerConsentProps {
  readonly control: Control<CustomerValues>
  /** El cliente a editar; `null` para uno nuevo. */
  readonly customer: Customer | null
  readonly errors: FieldErrors<CustomerValues>
}

/** La casilla del consentimiento o, si ya lo dio, cuándo fue: no se pide dos veces. */
export default function CustomerConsent({ control, customer, errors }: CustomerConsentProps) {
  const timeZone = useTimeZone()
  // `null` si es nuevo o se guardó antes de pedir el consentimiento.
  const consentAt = customer?.consent_at ?? null
  if (consentAt !== null) {
    return (
      <p className="m-0 text-sm text-muted-foreground">
        {`Aceptó el tratamiento de sus datos el ${formatDateTime(consentAt, timeZone)}.`}
      </p>
    )
  }
  return (
    <Controller
      control={control}
      name="consent"
      render={({ field }) => (
        <ConsentField id="customer-consent" checked={field.value} onChange={field.onChange} error={errors.consent?.message} />
      )}
    />
  )
}
