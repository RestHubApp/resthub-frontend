import type { MenuItem } from '../../api/types'

// Los grupos de opciones se editan como texto simple: una opción por línea,
// con su precio adicional después de un signo igual («Familiar = 10.50»). Es
// lo que se escribe más rápido en la laptop del encargado y no pide una tabla.

export interface GroupDraft {
  readonly name: string
  /** Obligatorio: el mesero no puede enviar el plato sin elegir. */
  readonly required: boolean
  /** Cuántas opciones se pueden elegir; uno se comporta como radio. */
  readonly max: string
  readonly options: string
}

export interface ParsedOption {
  readonly name: string
  readonly price: string
}

export interface ParsedGroup {
  readonly name: string
  readonly min_choices: number
  readonly max_choices: number
  readonly options: ParsedOption[]
}

/** O los datos listos, o el primer error para mostrarlo. */
export type Parsed<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: string }

const PRECIO = /^\d{1,4}(?:[.,]\d{1,2})?$/u

function fallo<T>(error: string): Parsed<T> {
  return { ok: false, error }
}

export function emptyGroup(): GroupDraft {
  return { name: '', required: false, max: '1', options: '' }
}

export function draftsOf(item: MenuItem | undefined): GroupDraft[] {
  return (item?.modifier_groups ?? []).map((group) => ({
    name: group.name,
    required: group.min_choices > 0,
    max: String(group.max_choices),
    options: group.options
      .map((option) => (Number(option.price) > 0 ? `${option.name} = ${option.price}` : option.name))
      .join('\n'),
  }))
}

function parseOption(line: string): Parsed<ParsedOption> {
  const [rawName = '', rawPrice = '0'] = line.split('=').map((part) => part.trim())
  if (rawName === '') {
    return fallo('Una opción no tiene nombre')
  }
  const precio = rawPrice === '' ? '0' : rawPrice.replace(',', '.')
  if (!PRECIO.test(precio)) {
    return fallo(`El precio de «${rawName}» no es válido`)
  }
  return { ok: true, value: { name: rawName, price: precio } }
}

function parseGroup(draft: GroupDraft): Parsed<ParsedGroup> {
  const nombre = draft.name.trim()
  if (nombre === '') {
    return fallo('Cada grupo de opciones necesita un nombre')
  }
  const opciones: ParsedOption[] = []
  for (const line of draft.options.split('\n').filter((texto) => texto.trim() !== '')) {
    const opcion = parseOption(line)
    if (!opcion.ok) {
      return fallo(`${nombre}: ${opcion.error}`)
    }
    opciones.push(opcion.value)
  }
  if (opciones.length === 0) {
    return fallo(`${nombre}: escribe al menos una opción`)
  }
  const maximo = Math.min(Math.max(Number.parseInt(draft.max, 10) || 1, 1), opciones.length)
  return {
    ok: true,
    value: { name: nombre, min_choices: draft.required ? 1 : 0, max_choices: maximo, options: opciones },
  }
}

/** Los grupos listos para el API, o el primer error para mostrarlo. */
export function parseGroups(drafts: readonly GroupDraft[]): Parsed<ParsedGroup[]> {
  const grupos: ParsedGroup[] = []
  for (const draft of drafts) {
    const grupo = parseGroup(draft)
    if (!grupo.ok) {
      return fallo(grupo.error)
    }
    grupos.push(grupo.value)
  }
  return { ok: true, value: grupos }
}
