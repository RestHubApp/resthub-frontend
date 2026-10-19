import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { restaurantQuery } from '@/api/restaurant'
import { FieldHint } from '@/components/FieldHint'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { InventoryFailure } from './InventoryFailure'
import { useSaveWasteThreshold } from './useSaveWasteThreshold'
import { thresholdForApi, isValidThreshold } from './wasteThreshold'

const HINT_ID = 'monto-merma-ayuda'

/**
 * Desde qué valor una merma espera la aprobación del encargado antes de bajar
 * el stock. Vacío, ninguna la pide.
 */
export function WasteThresholdForm() {
  const restaurant = useQuery(restaurantQuery)
  const [value, setValue] = useState<string | null>(null)
  const save = useSaveWasteThreshold(() => {
    setValue(null)
  })
  const written = value ?? restaurant.data?.waste_approval_threshold ?? ''
  const isValid = isValidThreshold(written)

  return (
    <form
      noValidate
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        if (isValid) {
          save.mutate(thresholdForApi(written))
        }
      }}
    >
      <Label htmlFor="monto-merma">Pedir aprobación de mermas desde (S/)</Label>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          id="monto-merma"
          inputMode="decimal"
          className="w-32"
          placeholder="Sin aprobación"
          value={written}
          aria-invalid={!isValid}
          aria-describedby={HINT_ID}
          onChange={(event) => {
            setValue(event.target.value)
          }}
        />
        <Button type="submit" variant="outline" disabled={!isValid || value === null || save.isPending}>
          {save.isPending ? 'Guardando…' : 'Guardar monto'}
        </Button>
      </div>
      <FieldHint id={HINT_ID} hint="Una merma que vale más queda por aprobar y no baja el stock hasta que la aprueben. Vacío: ninguna pide aprobación." />
      <InventoryFailure mutation={save} fallback="No se pudo guardar el monto." />
    </form>
  )
}
