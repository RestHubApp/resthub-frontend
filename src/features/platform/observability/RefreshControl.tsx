import { useIsFetching, useQueryClient } from '@tanstack/react-query'

import { platformObservabilityQueryKey } from '@/api/observability'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { refreshStatus } from './autoRefresh'
import type { ObsRefresh } from './useObsRefresh'

interface RefreshControlProps {
  readonly refresh: ObsRefresh
}

/** Pausar o reanudar la actualización automática, y releer ya. */
export function RefreshControl({ refresh }: RefreshControlProps) {
  const queryClient = useQueryClient()
  const isReading = useIsFetching({ queryKey: platformObservabilityQueryKey }) > 0
  const { paused: isPaused, setPaused, visibility } = refresh

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">Actualización</span>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-11 px-4"
          aria-pressed={isPaused}
          onClick={() => {
            setPaused(!isPaused)
          }}
        >
          <Icon name={isPaused ? 'resume' : 'pause'} size={16} />
          <span>{isPaused ? 'Reanudar' : 'Pausar'}</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          className="h-11 px-4"
          disabled={isReading}
          onClick={() => void queryClient.invalidateQueries({ queryKey: platformObservabilityQueryKey })}
        >
          <Icon name="update" size={16} className={isReading ? 'motion-safe:animate-spin' : undefined} />
          <span>{isReading ? 'Actualizando…' : 'Actualizar ahora'}</span>
        </Button>
        <p role="status" className="m-0 text-sm text-muted-foreground">
          {refreshStatus(isPaused, visibility)}
        </p>
      </div>
    </div>
  )
}
