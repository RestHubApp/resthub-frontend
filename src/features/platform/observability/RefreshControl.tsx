import { useIsFetching, useQueryClient } from '@tanstack/react-query'

import { platformObservabilityQueryKey } from '../../../api/observability'
import Icon from '../../../components/Icon'
import { Button } from '../../../components/ui/button'
import { refreshStatus } from './autoRefresh'
import type { ObsRefresh } from './useObsRefresh'

interface RefreshControlProps {
  readonly refresh: ObsRefresh
}

/** Pausar o reanudar la actualización automática, y releer ya. */
export default function RefreshControl({ refresh }: RefreshControlProps) {
  const queryClient = useQueryClient()
  const leyendo = useIsFetching({ queryKey: platformObservabilityQueryKey }) > 0
  const { paused, setPaused, visibility } = refresh

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">Actualización</span>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-11 px-4"
          aria-pressed={paused}
          onClick={() => {
            setPaused(!paused)
          }}
        >
          <Icon name={paused ? 'reanudar' : 'pausar'} size={16} />
          <span>{paused ? 'Reanudar' : 'Pausar'}</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          className="h-11 px-4"
          disabled={leyendo}
          onClick={() => void queryClient.invalidateQueries({ queryKey: platformObservabilityQueryKey })}
        >
          <Icon name="actualizar" size={16} className={leyendo ? 'motion-safe:animate-spin' : undefined} />
          <span>{leyendo ? 'Actualizando…' : 'Actualizar ahora'}</span>
        </Button>
        <p role="status" className="m-0 text-sm text-muted-foreground">
          {refreshStatus(paused, visibility)}
        </p>
      </div>
    </div>
  )
}
