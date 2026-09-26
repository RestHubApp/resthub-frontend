import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { restaurantQuery, restaurantQueryKey, updateRestaurant } from '../../api/restaurant'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { errorMessage } from '../../services/api'
import { formatPercent } from '../../services/format'
import { useNotifications } from '../../store/notifications'

const PORCENTAJE = /^(?:100(?:[.,]0{1,2})?|\d{1,2}(?:[.,]\d{1,2})?)$/u

/**
 * Hasta cuánto puede descontar un mesero sin llamar al encargado.
 *
 * Es una regla del local, no de un turno: vale hasta que el encargado la
 * cambie. Por encima del tope, y las cortesías, solo el encargado.
 */
export default function DiscountLimitForm() {
  const restaurante = useQuery(restaurantQuery)
  const [valor, setValor] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const push = useNotifications((state) => state.push)
  const guardar = useMutation({
    mutationFn: (percent: string) => updateRestaurant({ max_waiter_discount_percent: percent }),
    onSuccess: (actualizado) => {
      queryClient.setQueryData(restaurantQueryKey, actualizado)
      setValor(null)
      push({ tone: 'info', message: `El mesero descuenta hasta ${formatPercent(actualizado.max_waiter_discount_percent)}.` })
    },
    onError: (error) => {
      push({ tone: 'warning', message: errorMessage(error, 'No se pudo guardar el tope.') })
    },
  })
  const actual = restaurante.data?.max_waiter_discount_percent ?? ''
  const escrito = valor ?? actual
  const valido = PORCENTAJE.test(escrito.trim())

  return (
    <form
      noValidate
      className="flex flex-wrap items-end gap-3"
      onSubmit={(evento) => {
        evento.preventDefault()
        if (valido) {
          guardar.mutate(escrito.trim().replace(',', '.'))
        }
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="tope-descuento">Descuento máximo del mesero (%)</Label>
        <Input
          id="tope-descuento"
          inputMode="decimal"
          className="w-32"
          value={escrito}
          aria-invalid={!valido}
          onChange={(evento) => {
            setValor(evento.target.value)
          }}
        />
      </div>
      <Button type="submit" variant="outline" disabled={!valido || valor === null || guardar.isPending}>
        {guardar.isPending ? 'Guardando…' : 'Guardar tope'}
      </Button>
    </form>
  )
}
