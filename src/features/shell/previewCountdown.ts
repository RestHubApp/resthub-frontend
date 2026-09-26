import { formatCountdown } from '../../services/format'

// Desde cuándo la franja avisa que la vista previa está por vencer.
const AVISO_MS = 5 * 60_000

export interface PreviewTimeLeft {
  /** `Vence en 12:34` o `Venció`. */
  readonly label: string
  /** Quedan cinco minutos o menos: la franja lo resalta. */
  readonly soon: boolean
}

/**
 * Lo que la franja de vista previa dice del vencimiento.
 *
 * La vista previa no se renueva: vence a la hora de su token (`exp`) y hay
 * que abrir otra desde la administración. `null` si el token no dice cuándo.
 */
export function previewTimeLeft(expiresAt: number | null, now: number): PreviewTimeLeft | null {
  if (expiresAt === null) {
    return null
  }
  const falta = expiresAt - now
  if (falta <= 0) {
    return { label: 'Venció', soon: true }
  }
  return { label: `Vence en ${formatCountdown(falta)}`, soon: falta <= AVISO_MS }
}
