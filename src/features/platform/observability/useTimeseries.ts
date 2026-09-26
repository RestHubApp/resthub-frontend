import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { obsTimeseriesQuery } from '../../../api/observability'
import type { ObsWindowParams } from '../../../api/types'
import type { LiveOptions } from './useObsRefresh'

/** La serie de la ventana. Tráfico y latencia la leen juntas: es una sola petición. */
export function useTimeseries(params: ObsWindowParams, live: LiveOptions) {
  return useQuery({ ...obsTimeseriesQuery(params), ...live, placeholderData: keepPreviousData })
}
