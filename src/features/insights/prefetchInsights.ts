import { salesSummaryQuery } from '../../api/insights'
import { todayIn } from '../../services/format'
import { prefetch } from '../../services/queryClient'
import { can, currentTimeZone } from '../../store/session'
import { DEFAULT_PRESET, presetRange } from './dateRange'

/**
 * Panel: el resumen del rango con el que abre la pantalla.
 *
 * Si la dirección trae otro rango, la pantalla pide el suyo; esto solo
 * adelanta el caso de todos los días, entrar desde el menú.
 */
export function prefetchInsights(): void {
  if (!can('insights.read')) {
    return
  }
  prefetch(salesSummaryQuery(presetRange(DEFAULT_PRESET, todayIn(currentTimeZone()))))
}
