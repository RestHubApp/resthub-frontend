import Icon from '../../components/Icon'
import { formatChange, toNumber } from '../../services/format'

interface KpiTileProps {
  readonly label: string
  readonly value: string
  /** Variación porcentual contra el período anterior; `null` si antes no hubo nada. */
  readonly change: string | null
  /** Si subir es bueno (ventas) o malo (cancelados). */
  readonly higherIsBetter: boolean
  readonly comparedTo: string
  readonly detail?: string
}

type Tone = 'good' | 'bad' | 'flat'

const TONE_CLASS: Record<Tone, string> = {
  good: 'text-success',
  bad: 'text-destructive',
  flat: 'text-muted-foreground',
}

function toneFor(change: number, higherIsBetter: boolean): Tone {
  if (change === 0) {
    return 'flat'
  }
  return change > 0 === higherIsBetter ? 'good' : 'bad'
}

function iconFor(change: number) {
  if (change === 0) {
    return 'tendenciaEstable'
  }
  return change > 0 ? 'tendenciaSube' : 'tendenciaBaja'
}

/**
 * Un indicador del período: el número y cuánto cambió.
 *
 * La variación lleva flecha y signo escritos, además del color, que dice si
 * el cambio es bueno o malo para el negocio (más cancelados es malo).
 */
export default function KpiTile({ label, value, change, higherIsBetter, comparedTo, detail }: KpiTileProps) {
  const numero = change === null ? null : toNumber(change)

  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-xl bg-card px-4 py-4 ring-1 ring-foreground/10">
      <p className="m-0 text-sm text-muted-foreground">{label}</p>
      <p className="m-0 text-2xl leading-tight font-semibold text-foreground sm:text-[1.75rem]">{value}</p>
      {detail === undefined ? null : <p className="m-0 text-xs text-muted-foreground">{detail}</p>}
      {numero === null ? (
        <p className="m-0 text-xs text-muted-foreground">Sin datos del período anterior</p>
      ) : (
        <p className={`m-0 flex flex-wrap items-center gap-1 text-xs ${TONE_CLASS[toneFor(numero, higherIsBetter)]}`}>
          <Icon name={iconFor(numero)} size={14} />
          <span className="font-semibold">{formatChange(numero)}</span>
          <span className="text-muted-foreground">vs. {comparedTo}</span>
        </p>
      )}
    </div>
  )
}
