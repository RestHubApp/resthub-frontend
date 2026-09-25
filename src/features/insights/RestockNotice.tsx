import type { RestockReport } from '../../api/types'
import Icon from '../../components/Icon'
import { formatDateTime } from '../../services/format'
import { useTimeZone } from '../../store/session'

interface RestockNoticeProps {
  readonly report: RestockReport
}

/** Qué tan al día está la recomendación, y que la decisión es del encargado. */
export default function RestockNotice({ report }: RestockNoticeProps) {
  const vencida = report.items.some((item) => item.is_stale)
  const guardada = report.refreshed_at !== null
  const timeZone = useTimeZone()

  return (
    <div className="flex flex-col gap-2">
      <p className="m-0 flex items-start gap-2 rounded-lg bg-secondary px-3 py-2 text-sm text-secondary-foreground">
        <Icon name="ia" size={18} className="mt-0.5 shrink-0" />
        <span>
          <strong className="font-semibold">La IA recomienda; tú decides.</strong> Cada sugerencia explica en qué se basa.
          Ninguna compra se hace sola: úsala como lista de revisión antes de ir al mercado.
        </span>
      </p>
      {guardada ? null : (
        <p role="status" className="m-0 flex items-start gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
          <Icon name="alerta" size={18} className="mt-0.5 shrink-0" />
          Es una vista previa calculada con las reglas fijas. Toca «Actualizar recomendaciones» para decidir y guardar.
        </p>
      )}
      {guardada && vencida ? (
        <p role="status" className="m-0 flex items-start gap-2 rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning">
          <Icon name="alerta" size={18} className="mt-0.5 shrink-0" />
          Algunas recomendaciones tienen más de un día. Actualízalas antes de comprar.
        </p>
      ) : null}
      {report.refreshed_at === null ? null : (
        <p className="m-0 text-xs text-muted-foreground">
          Última actualización: {formatDateTime(report.refreshed_at, timeZone)}
        </p>
      )}
    </div>
  )
}
