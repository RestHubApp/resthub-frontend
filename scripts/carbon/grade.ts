import { co2 } from '@tgwf/co2'

/** Las notas de Website Carbon y Digital Beacon, de la mejor a la peor. */
const GRADES = ['A+', 'A', 'B', 'C', 'D', 'E', 'F'] as const
export type Grade = (typeof GRADES)[number]

export interface Estimate {
  readonly bytes: number
  /** Gramos de CO2e de una primera visita. */
  readonly grams: number
  readonly grade: Grade
}

// Sustainable Web Design v4: el mismo modelo que usa websitecarbon.com. La
// escala de notas (A+ hasta 0,040 g; A hasta 0,079 g…) viene con la librería.
// `perVisit` cuenta una primera visita: nada en caché y sin segunda visita que la abarate.
const MODEL = new co2({ model: 'swd', version: 4, rating: true })

function gradeOf(value: string): Grade | undefined {
  return GRADES.find((grade) => grade === value)
}

/** Los gramos de CO2e y la nota de transferir `bytes` en una primera visita. */
export function estimate(bytes: number): Estimate {
  const { total, rating } = MODEL.perVisit(bytes)
  const grade = gradeOf(rating)
  if (grade === undefined) {
    throw new Error(`Nota desconocida: ${rating}`)
  }
  return { bytes, grams: total, grade }
}

/** Si `grade` es igual o mejor que `minimum`. */
export function isAtLeast(grade: Grade, minimum: Grade): boolean {
  return GRADES.indexOf(grade) <= GRADES.indexOf(minimum)
}

export function parseGrade(text: string): Grade {
  const grade = gradeOf(text)
  if (grade === undefined) {
    throw new Error(`La nota mínima debe ser una de ${GRADES.join(', ')}.`)
  }
  return grade
}
