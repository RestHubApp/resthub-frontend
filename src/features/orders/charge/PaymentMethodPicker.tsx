import type { UseFormRegisterReturn } from 'react-hook-form'

import { PAYMENT_METHODS } from '../orderLabels'

interface PaymentMethodPickerProps {
  readonly field: UseFormRegisterReturn
}

/**
 * Los medios de pago como fichas grandes.
 *
 * Son radios nativos: se registran como cualquier campo, las flechas del
 * teclado recorren las opciones y el lector de pantalla dice cual esta elegida.
 */
export default function PaymentMethodPicker({ field }: PaymentMethodPickerProps) {
  return (
    <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
      <legend className="mb-2 text-sm font-medium">Medio de pago</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {PAYMENT_METHODS.map((metodo) => (
          <label
            key={metodo.value}
            className="flex min-h-12 cursor-pointer items-center justify-center rounded-lg px-3 text-sm font-semibold ring-1 ring-input transition-colors hover:bg-muted has-checked:bg-primary has-checked:text-primary-foreground has-checked:ring-primary has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
          >
            <input type="radio" value={metodo.value} className="sr-only" {...field} />
            {metodo.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
