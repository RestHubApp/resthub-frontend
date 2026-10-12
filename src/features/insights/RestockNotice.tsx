import type { RestockReport } from '@/api/types'
import { FormMessage } from '@/components/FormMessage'
import { formatDateTime } from '@/services/format'
import { useTimeZone } from '@/store/session'

interface RestockNoticeProps {
  readonly report: RestockReport
}

/** Qué tan al día está la recomendación, y que la decisión es del encargado. */
export function RestockNotice({ report }: RestockNoticeProps) {
  const isExpired = report.items.some((item) => item.is_stale)
  const wasSaved = report.refreshed_at !== null
  const timeZone = useTimeZone()

  return (
    <div className="flex flex-col gap-2">
      <FormMessage tone="info" icon="ai" role="status">
        <strong className="font-semibold">La IA recomienda; tú decides.</strong> Cada sugerencia explica en qué se basa.
        Ninguna compra se hace sola: úsala como lista de revisión antes de ir al mercado.
      </FormMessage>
      {wasSaved ? null : (
        <FormMessage tone="info" icon="alert">
          Es una vista previa calculada con las reglas fijas. Toca «Actualizar recomendaciones» para decidir y guardar.
        </FormMessage>
      )}
      {wasSaved && isExpired ? (
        <FormMessage tone="warning" icon="alert">
          Algunas recomendaciones tienen más de un día. Actualízalas antes de comprar.
        </FormMessage>
      ) : null}
      {report.refreshed_at === null ? null : (
        <p className="m-0 text-xs text-muted-foreground">
          Última actualización: {formatDateTime(report.refreshed_at, timeZone)}
        </p>
      )}
    </div>
  )
}
