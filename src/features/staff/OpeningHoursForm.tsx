import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import { restaurantQuery, restaurantQueryKey, updateRestaurant } from '@/api/restaurant'
import type { OpeningPeriod } from '@/api/types'
import { Icon } from '@/components/Icon'
import * as icons from '@/components/icons'
import { Button } from '@/components/ui/button'
import { useNotifiedMutation } from '@/store/useNotifiedMutation'
import { OpeningPeriodRow } from './OpeningPeriodRow'
import { draftsOf, newDraft, type PeriodDraft, periodProblem, savedHoursText, toPeriods } from './openingHours'

const NO_PERIODS: readonly OpeningPeriod[] = []

/**
 * Los tramos del horario del local (RFS-32). Un día sin tramos es un día
 * cerrado; sin ningún tramo no se marca nada. Lo que el servidor rechace
 * (`invalid_opening_hours`) llega como aviso con su motivo.
 */
export function OpeningHoursForm() {
  const restaurant = useQuery(restaurantQuery)
  const [drafts, setDrafts] = useState<PeriodDraft[] | null>(null)
  const save = useNotifiedMutation({
    mutationFn: (periods: OpeningPeriod[]) => updateRestaurant({ opening_hours: periods }),
    success: (updated) => savedHoursText(updated.opening_hours),
    failure: 'No se pudo guardar el horario.',
    updateCache: (queryClient, updated) => { queryClient.setQueryData(restaurantQueryKey, updated) },
    onSuccess: () => { setDrafts(null) },
  })
  const saved = restaurant.data?.opening_hours ?? NO_PERIODS
  // Las claves de las filas se fijan una vez por horario guardado: si no, cada render las remontaría.
  const savedDrafts = useMemo(() => draftsOf(saved), [saved])
  const shown = drafts ?? savedDrafts
  const isValid = shown.every((draft) => periodProblem(draft) === undefined)
  const update = (next: PeriodDraft) => { setDrafts(shown.map((draft) => (draft.key === next.key ? next : draft))) }
  const remove = (key: number) => { setDrafts(shown.filter((draft) => draft.key !== key)) }

  return (
    <form
      noValidate
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        if (isValid) save.mutate(toPeriods(shown))
      }}
    >
      {shown.length === 0 ? <p className="m-0 text-sm text-muted-foreground">Sin horario: no se marcan accesos fuera de horario.</p> : null}
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {shown.map((draft) => (
          <OpeningPeriodRow key={draft.key} draft={draft} onChange={update} onRemove={() => { remove(draft.key) }} />
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => { setDrafts([...shown, newDraft(shown)]) }}>
          <Icon glyph={icons.add} size={16} />
          <span>Agregar tramo</span>
        </Button>
        <Button type="submit" disabled={!isValid || drafts === null || save.isPending}>
          {save.isPending ? 'Guardando…' : 'Guardar horario'}
        </Button>
      </div>
    </form>
  )
}
