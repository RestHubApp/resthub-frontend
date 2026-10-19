import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { currentUserQueryKey } from '@/api/auth'
import { restaurantQuery, restaurantQueryKey, updateRestaurant } from '@/api/restaurant'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useNotifiedMutation } from '@/store/useNotifiedMutation'

// De 0 (no se bloquea) a 120 minutos, como lo acepta el servidor.
const MINUTES = /^(?:\d{1,2}|1[01]\d|120)$/u

function savedText(minutes: number): string {
  return minutes === 0 ? 'Las sesiones ya no se bloquean por inactividad.' : `Las sesiones se bloquean tras ${String(minutes)} minutos sin uso.`
}

/**
 * Tras cuántos minutos sin uso se bloquea la sesión del personal entero
 * (RFS-29). Cero lo apaga; en un local con celulares compartidos conviene que
 * sea corto.
 */
export function IdleLockForm() {
  const restaurant = useQuery(restaurantQuery)
  const [value, setValue] = useState<string | null>(null)
  const save = useNotifiedMutation({
    mutationFn: (minutes: number) => updateRestaurant({ idle_lock_minutes: minutes }),
    success: (updated) => savedText(updated.idle_lock_minutes),
    failure: 'No se pudo guardar el bloqueo por inactividad.',
    updateCache: (queryClient, updated) => { queryClient.setQueryData(restaurantQueryKey, updated) },
    // La sesión propia también trae los minutos: el temporizador del armazón los usa.
    invalidate: [currentUserQueryKey],
    onSuccess: () => { setValue(null) },
  })
  const written = value ?? String(restaurant.data?.idle_lock_minutes ?? '')
  const isValid = MINUTES.test(written.trim())

  return (
    <form
      noValidate
      className="flex flex-wrap items-end gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        if (isValid) save.mutate(Number(written.trim()))
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="bloqueo-inactividad">Minutos sin uso antes de bloquear (0 lo apaga)</Label>
        <Input id="bloqueo-inactividad" inputMode="numeric" className="w-32" value={written} aria-invalid={!isValid} onChange={(event) => { setValue(event.target.value) }} />
      </div>
      <Button type="submit" variant="outline" disabled={!isValid || value === null || save.isPending}>
        {save.isPending ? 'Guardando…' : 'Guardar'}
      </Button>
    </form>
  )
}
