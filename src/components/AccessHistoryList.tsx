import { StatusBadge } from './StatusBadge'
import { Button } from './ui/button'

/** Un acceso ya descrito (`describeAccess`). */
interface AccessLine {
  readonly id: number
  readonly when: string
  readonly outcome: string
  readonly isSuccess: boolean
  readonly device: string
  readonly detail: string
  readonly marks: readonly string[]
}

interface AccessHistoryListProps {
  /** El nombre de la lista para el lector de pantalla. */
  readonly label: string
  readonly accesses: readonly AccessLine[]
  /** Cuántos accesos hay en total, para ofrecer «Ver más». */
  readonly total: number
  readonly onMore: () => void
  readonly isLoadingMore: boolean
}

/**
 * Los accesos de una cuenta, el más reciente primero: cuándo, si entró, desde
 * qué dispositivo y dónde. Un dispositivo o país nuevo lleva su marca. Es una
 * lista y no una tabla para que en el celular no se desplace de costado.
 */
export function AccessHistoryList({ label, accesses, total, onMore, isLoadingMore }: AccessHistoryListProps) {
  return (
    <div className="flex flex-col gap-3">
      <ul aria-label={label} className="m-0 flex list-none flex-col divide-y divide-border p-0">
        {accesses.map((access) => (
          <li key={access.id} className="flex flex-col gap-1 py-3">
            <p className="m-0 flex flex-wrap items-center gap-2">
              <span className="font-medium">{access.when}</span>
              <StatusBadge label={access.outcome} tone={access.isSuccess ? 'completed' : 'cancelled'} />
              {access.marks.map((mark) => <StatusBadge key={mark} label={mark} tone="pending" />)}
            </p>
            <p className="m-0 text-sm break-words text-muted-foreground">{`${access.device} · ${access.detail}`}</p>
          </li>
        ))}
      </ul>
      {accesses.length < total ? (
        <Button type="button" variant="outline" className="self-start" disabled={isLoadingMore} onClick={onMore}>
          {isLoadingMore ? 'Cargando…' : 'Ver más'}
        </Button>
      ) : null}
    </div>
  )
}
