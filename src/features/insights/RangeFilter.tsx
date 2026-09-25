import { useState } from 'react'

import type { InsightsPeriod } from '../../api/types'
import Icon from '../../components/Icon'
import CustomRangeForm from './CustomRangeForm'
import { RANGE_PRESETS } from './dateRange'
import type { InsightsRange } from './useInsightsRange'
import { formatLongDate, todayIn } from '../../services/format'

interface RangeFilterProps {
  readonly range: InsightsRange
  readonly period: InsightsPeriod | undefined
  readonly timeZone: string
}

const OPTION =
  'inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50'

function periodText(period: InsightsPeriod): string {
  if (period.date_from === period.date_to) {
    return `${formatLongDate(period.date_from)}.`
  }
  return `Del ${formatLongDate(period.date_from)} al ${formatLongDate(period.date_to)} (${String(period.days)} días).`
}

/**
 * El filtro de fechas: una sola fila arriba de lo que acota. Primero los
 * rangos de siempre; el personalizado abre dos fechas.
 */
export default function RangeFilter({ range, period, timeZone }: RangeFilterProps) {
  const [personalizando, setPersonalizando] = useState(range.preset === 'personalizado')
  const hoy = todayIn(timeZone)

  return (
    <section aria-label="Período" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div role="group" aria-label="Rango de fechas" className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
          {RANGE_PRESETS.map((preset) => {
            const activo = preset.value === 'personalizado' ? personalizando : !personalizando && range.preset === preset.value
            return (
              <button
                key={preset.value}
                type="button"
                aria-pressed={activo}
                onClick={() => {
                  if (preset.value === 'personalizado') {
                    setPersonalizando(true)
                    return
                  }
                  setPersonalizando(false)
                  range.choosePreset(preset.value)
                }}
                className={activo ? `${OPTION} bg-card font-semibold text-foreground shadow-sm` : `${OPTION} text-muted-foreground hover:text-foreground`}
              >
                {activo ? <Icon name="confirmar" size={14} /> : null}
                {preset.label}
              </button>
            )
          })}
        </div>
        {period === undefined ? null : (
          <p className="m-0 flex items-center gap-1.5 text-sm text-muted-foreground" aria-live="polite">
            <Icon name="fecha" size={16} />
            {periodText(period)}
          </p>
        )}
      </div>
      {personalizando ? (
        <CustomRangeForm initialFrom={range.params.date_from} initialTo={range.params.date_to} max={hoy} onApply={range.chooseCustom} />
      ) : null}
    </section>
  )
}
