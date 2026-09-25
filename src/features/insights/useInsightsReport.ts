import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { insightsReportKey } from '../../api/insights'
import type { InsightsRangeParams } from '../../api/types'

/**
 * Un reporte del panel para el rango elegido.
 *
 * Al cambiar de rango se queda con los datos anteriores hasta que llegan los
 * nuevos: el gráfico se atenúa en vez de desaparecer y saltar.
 */
export function useInsightsReport<T>(
  report: string,
  range: InsightsRangeParams,
  fetcher: (range: InsightsRangeParams) => Promise<T>,
) {
  const query = useQuery({
    queryKey: insightsReportKey(report, range),
    queryFn: () => fetcher(range),
    placeholderData: keepPreviousData,
  })
  return { ...query, refreshing: query.isFetching && query.isPlaceholderData }
}
