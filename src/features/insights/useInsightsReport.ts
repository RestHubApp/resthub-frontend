import { keepPreviousData, useQuery } from '@tanstack/react-query'

import type { insightsReportQuery } from '../../api/insights'

/**
 * Un reporte del panel para el rango elegido.
 *
 * Al cambiar de rango se queda con los datos anteriores hasta que llegan los
 * nuevos: el gráfico se atenúa en vez de desaparecer y saltar.
 */
export function useInsightsReport<T>(options: ReturnType<typeof insightsReportQuery<T>>) {
  const query = useQuery({ ...options, placeholderData: keepPreviousData })
  return { ...query, refreshing: query.isFetching && query.isPlaceholderData }
}
