// Minutos a partir de los que un pedido en cocina, o listo sin servir, pide atencion.
const WARN_MINUTES = 15
const LATE_MINUTES = 25

/** Cuanta atencion pide un pedido: `late` pasados 25 minutos, `alert` pasados 15. */
export type ElapsedLevel = 'normal' | 'alert' | 'late'

/** El nivel de un pedido segun los minutos que lleva; solo los pedidos vigilados se tiñen. */
export function elapsedLevel(isWatched: boolean, minutes: number): ElapsedLevel {
  if (!isWatched || minutes < WARN_MINUTES) {
    return 'normal'
  }
  return minutes >= LATE_MINUTES ? 'late' : 'alert'
}

/** Las clases de color de cada nivel. */
export const TONE_BY_LEVEL: Readonly<Record<ElapsedLevel, string>> = {
  normal: 'bg-muted text-muted-foreground',
  alert: 'bg-warning/15 text-warning',
  late: 'bg-destructive text-white',
}
