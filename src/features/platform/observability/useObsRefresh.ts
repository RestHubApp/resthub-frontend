import { useState } from 'react'

import { usePageVisibility } from '../../../hooks/usePageVisibility'
import { refreshInterval } from './autoRefresh'

/** Lo que cada lectura del panel agrega a su consulta para releerse sola. */
export interface LiveOptions {
  readonly refetchInterval: number | false
  /** Al volver a la pestaña se relee lo que ya pasó sus 30 s, salvo en pausa. */
  readonly refetchOnWindowFocus: boolean
}

export interface ObsRefresh {
  readonly paused: boolean
  readonly setPaused: (paused: boolean) => void
  readonly visibility: DocumentVisibilityState
  readonly live: LiveOptions
}

/** La actualización automática del panel: cada 30 s con la pestaña a la vista, con pausa manual. */
export function useObsRefresh(): ObsRefresh {
  const [paused, setPaused] = useState(false)
  const visibility = usePageVisibility()
  return {
    paused,
    setPaused,
    visibility,
    live: { refetchInterval: refreshInterval(paused, visibility), refetchOnWindowFocus: !paused },
  }
}
