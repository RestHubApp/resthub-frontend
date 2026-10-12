import { useSearchParams } from 'react-router'

import { customRangeProblem, DEFAULT_PRESET, isRangePreset, presetRange, type FixedPreset, type RangeDates, type RangePreset } from './dateRange'
import { todayIn } from '@/services/format'

export interface InsightsRange {
  readonly preset: RangePreset
  /** Las fechas que se piden al servidor. */
  readonly params: RangeDates
  readonly choosePreset: (preset: FixedPreset) => void
  readonly chooseCustom: (from: string, to: string) => void
}

/**
 * El rango del panel, guardado en la dirección (`?rango=7d`).
 *
 * Vive en la URL y no en un estado de React para que recargar, volver atrás o
 * compartir el enlace muestre el mismo período, y para que todos los gráficos
 * de la pantalla lean el mismo rango.
 */
export function useInsightsRange(timeZone: string): InsightsRange {
  const [search, setSearch] = useSearchParams()
  const today = todayIn(timeZone)
  const order = search.get('rango')
  const from = search.get('desde') ?? ''
  const until = search.get('hasta') ?? ''

  let preset: RangePreset = isRangePreset(order) ? order : DEFAULT_PRESET
  if (preset === 'personalizado' && customRangeProblem(from, until) !== null) {
    preset = DEFAULT_PRESET
  }
  const params =
    preset === 'personalizado' ? { date_from: from, date_to: until } : presetRange(preset, today)

  return {
    preset,
    params,
    choosePreset: (value) => {
      setSearch({ 'rango': value }, { replace: true })
    },
    chooseCustom: (from, to) => {
      setSearch({ 'rango': 'personalizado', 'desde': from, 'hasta': to }, { replace: true })
    },
  }
}
