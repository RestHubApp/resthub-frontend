import { z } from 'zod'

import { parseDecimal } from './units'

// La sección «Envase» del formulario de un insumo. Cada campo es opcional:
// sin el tamaño, el insumo no tiene presentación. Los pesos van juntos o no van.

const MAX_LABEL = 30
// eslint-disable-next-line security/detect-unsafe-regex -- sin retroceso catastrófico: recheck la clasifica como segura (ver sast.md)
const OPTIONAL_DECIMAL = /^(?:\d+(?:[.,]\d{1,3})?)?$/u
const DECIMAL_MESSAGE = 'Escribe un número con hasta 3 decimales'

export const packagingFields = {
  packaging_size: z.string().trim().regex(OPTIONAL_DECIMAL, DECIMAL_MESSAGE),
  packaging_size_unit: z.string(),
  packaging_label: z.string().trim().max(MAX_LABEL, `Usa como máximo ${String(MAX_LABEL)} caracteres`),
  packaging_full: z.string().trim().regex(OPTIONAL_DECIMAL, DECIMAL_MESSAGE),
  packaging_empty: z.string().trim().regex(OPTIONAL_DECIMAL, DECIMAL_MESSAGE),
}

export interface PackagingValues {
  readonly packaging_size: string
  readonly packaging_size_unit: string
  readonly packaging_label: string
  readonly packaging_full: string
  readonly packaging_empty: string
}

type Issue = readonly [field: keyof PackagingValues, message: string]

function sizeIssue(values: PackagingValues): Issue | null {
  const hasRest = values.packaging_label !== '' || values.packaging_full !== '' || values.packaging_empty !== ''
  if (values.packaging_size === '') {
    return hasRest ? ['packaging_size', 'Escribe cuánto trae el envase'] : null
  }
  return parseDecimal(values.packaging_size) > 0 ? null : ['packaging_size', 'Tiene que ser mayor que cero']
}

function weightIssue(values: PackagingValues): Issue | null {
  const { packaging_full: full, packaging_empty: empty } = values
  if (full === '' && empty === '') {
    return null
  }
  if (full === '' || empty === '') {
    return [full === '' ? 'packaging_full' : 'packaging_empty', 'Para contar por peso escribe los dos pesos, o deja los dos vacíos']
  }
  if (parseDecimal(empty) <= 0) {
    return ['packaging_empty', 'Tiene que ser mayor que cero']
  }
  return parseDecimal(full) > parseDecimal(empty) ? null : ['packaging_full', 'El envase lleno tiene que pesar más que vacío']
}

/** Los problemas de la sección, campo por campo (el backend los rechaza con `invalid_packaging`). */
export function packagingIssues(values: PackagingValues): readonly Issue[] {
  return [sizeIssue(values), weightIssue(values)].filter((issue) => issue !== null)
}
