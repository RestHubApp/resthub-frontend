import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { restaurantQuery, restaurantQueryKey, updateRestaurant } from '@/api/restaurant'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { errorMessage } from '@/services/api'
import { formatPercent } from '@/services/format'
import { useNotifications } from '@/store/notifications'

// eslint-disable-next-line security/detect-unsafe-regex -- sin retroceso catastrófico: recheck la clasifica como segura (ver sast.md)
const PERCENTAGE = /^(?:100(?:[.,]0{1,2})?|\d{1,2}(?:[.,]\d{1,2})?)$/u

/**
 * Hasta cuánto puede descontar un mesero sin llamar al encargado.
 *
 * Es una regla del local, no de un turno: vale hasta que el encargado la
 * cambie. Por encima del tope, y las cortesías, solo el encargado.
 */
export function DiscountLimitForm() {
  const restaurant = useQuery(restaurantQuery)
  const [value, setValue] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const push = useNotifications((state) => state.push)
  const save = useMutation({
    mutationFn: (percent: string) => updateRestaurant({ max_waiter_discount_percent: percent }),
    onSuccess: (updated) => {
      queryClient.setQueryData(restaurantQueryKey, updated)
      setValue(null)
      push({ tone: 'info', message: `El mesero descuenta hasta ${formatPercent(updated.max_waiter_discount_percent)}.` })
    },
    onError: (error) => {
      push({ tone: 'warning', message: errorMessage(error, 'No se pudo guardar el tope.') })
    },
  })
  const actual = restaurant.data?.max_waiter_discount_percent ?? ''
  const written = value ?? actual
  const isValid = PERCENTAGE.test(written.trim())

  return (
    <form
      noValidate
      className="flex flex-wrap items-end gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        if (isValid) {
          save.mutate(written.trim().replace(',', '.'))
        }
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="tope-descuento">Descuento máximo del mesero (%)</Label>
        <Input
          id="tope-descuento"
          inputMode="decimal"
          className="w-32"
          value={written}
          aria-invalid={!isValid}
          onChange={(event) => {
            setValue(event.target.value)
          }}
        />
      </div>
      <Button type="submit" variant="outline" disabled={!isValid || value === null || save.isPending}>
        {save.isPending ? 'Guardando…' : 'Guardar tope'}
      </Button>
    </form>
  )
}
