import type { StaffResponse } from '@/api/types'
import { formatDateTime } from '@/services/format'
import { useTimeZone } from '@/store/session'

interface DeactivationNoteProps {
  readonly account: StaffResponse
  /** El nombre de quien la desactivó, si está en la lista cargada. */
  readonly nameOf: (userId: number) => string | undefined
}

/** `Desactivada el 17 oct 2026, 10:30 por Ana Torres: ya no trabaja en el local.` */
function noteOf(account: StaffResponse, nameOf: DeactivationNoteProps['nameOf'], timeZone: string): string {
  const when = typeof account.deactivated_at === 'string' ? ` el ${formatDateTime(account.deactivated_at, timeZone)}` : ''
  const who = typeof account.deactivated_by === 'number' ? nameOf(account.deactivated_by) : undefined
  const by = who === undefined ? '' : ` por ${who}`
  return `Desactivada${when}${by}: ${account.deactivation_reason}`
}

/**
 * Quién desactivó la cuenta, cuándo y por qué (RFS-18). Las cuentas
 * desactivadas antes de pedir el motivo no lo tienen y no muestran nada.
 */
export function DeactivationNote({ account, nameOf }: DeactivationNoteProps) {
  const timeZone = useTimeZone()
  if (account.is_active || account.deactivation_reason === '') return null
  return <span className="text-sm break-words whitespace-normal text-muted-foreground">{noteOf(account, nameOf, timeZone)}</span>
}
