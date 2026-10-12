import type { DocumentType, LookupDocumentType } from '@/api/types'

const RUC_LENGTH = 11
const DNI_LENGTH = 8
const RUC_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2] as const

/** Si el RUC tiene 11 dígitos y su dígito verificador cuadra (módulo 11, como lo calcula SUNAT). */
export function isValidRuc(number: string): boolean {
  if (!/^\d{11}$/u.test(number)) {
    return false
  }
  const digits = Array.from(number, Number)
  const sum = RUC_WEIGHTS.reduce((total, weight, index) => total + weight * (digits[index] ?? 0), 0)
  const check = (11 - (sum % 11)) % 10
  return check === digits[RUC_LENGTH - 1]
}

/** Si el DNI tiene 8 dígitos. */
export function isValidDni(number: string): boolean {
  return /^\d{8}$/u.test(number)
}

/** Los documentos que se pueden buscar en SUNAT o RENIEC; el carné de extranjería no. */
export function lookupTypeOf(type: DocumentType): LookupDocumentType | null {
  return type === 'ruc' || type === 'dni' ? type : null
}

/** Lo que falta corregir antes de buscar, o `null` si el formato ya cuadra. */
export function formatProblem(type: LookupDocumentType, number: string): string | null {
  if (type === 'ruc') {
    if (isValidRuc(number)) {
      return null
    }
    return number.length === RUC_LENGTH ? 'El RUC no es válido: revisa los números.' : `El RUC tiene ${String(RUC_LENGTH)} dígitos.`
  }
  return isValidDni(number) ? null : `El DNI tiene ${String(DNI_LENGTH)} dígitos.`
}
