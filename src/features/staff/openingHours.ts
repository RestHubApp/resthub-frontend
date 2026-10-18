import type { OpeningPeriod } from '@/api/types'

// El horario de atención del local (RFS-32): tramos por día, en la hora del local.

export const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const

const HHMM = /^(?:[01]\d|2[0-3]):[0-5]\d$/u

/** Un tramo mientras se edita: las horas como las escribe el campo. */
export interface PeriodDraft {
  readonly key: number
  readonly day: number
  readonly opens: string
  readonly closes: string
}

let nextKey = 0

function draftOf(day: number, opens: string, closes: string): PeriodDraft {
  nextKey += 1
  return { key: nextKey, day, opens, closes }
}

/** El servidor responde «08:30:00»; el campo de hora trabaja con «08:30». */
export function draftsOf(periods: readonly OpeningPeriod[]): PeriodDraft[] {
  return periods.map((period) => draftOf(period.day, period.opens.slice(0, 5), period.closes.slice(0, 5)))
}

/** Un tramo nuevo: el día siguiente al último, con un horario de almuerzo y cena. */
export function newDraft(drafts: readonly PeriodDraft[]): PeriodDraft {
  const last = drafts.at(-1)
  return draftOf(last === undefined ? 0 : (last.day + 1) % DAY_NAMES.length, last?.opens ?? '12:00', last?.closes ?? '23:00')
}

/** Lo que falla en un tramo, o `undefined` si está bien. */
export function periodProblem(draft: PeriodDraft): string | undefined {
  if (!HHMM.test(draft.opens) || !HHMM.test(draft.closes)) return 'Escribe las dos horas.'
  if (draft.opens === draft.closes) return 'No puede abrir y cerrar a la misma hora.'
  return undefined
}

export function toPeriods(drafts: readonly PeriodDraft[]): OpeningPeriod[] {
  return drafts.map(({ day, opens, closes }) => ({ day, opens, closes }))
}

/** El aviso al guardar. */
export function savedHoursText(periods: readonly OpeningPeriod[]): string {
  if (periods.length === 0) return 'El local ya no tiene horario: no se marcan accesos fuera de horario.'
  return 'Horario guardado. Los accesos fuera de él se marcan en el historial.'
}
