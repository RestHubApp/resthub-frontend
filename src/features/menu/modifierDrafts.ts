import type { MenuItem } from '@/api/types'

// Los grupos de opciones se editan como texto simple: una opción por línea,
// con su precio adicional después de un signo igual («Familiar = 10.50»). Es
// lo que se escribe más rápido en la laptop del encargado y no pide una tabla.

export interface GroupDraft {
  /** Identidad estable del borrador en la lista: sobrevive a quitar o reordenar grupos. */
  readonly key: string
  readonly name: string
  /** Obligatorio: el mesero no puede enviar el plato sin elegir. */
  readonly required: boolean
  /** Cuántas opciones se pueden elegir; uno se comporta como radio. */
  readonly max: string
  readonly options: string
}

interface ParsedOption {
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

// eslint-disable-next-line security/detect-unsafe-regex -- sin retroceso catastrófico: recheck la clasifica como segura (ver sast.md)
const PRICE = /^\d{1,4}(?:[.,]\d{1,2})?$/u

function failure<T>(error: string): Parsed<T> {
  return { ok: false, error }
}

const draftCounter = { last: 0 }

function newDraftKey(): string {
  draftCounter.last += 1
  return `grupo-${String(draftCounter.last)}`
}

export function emptyGroup(): GroupDraft {
  return { key: newDraftKey(), name: '', required: false, max: '1', options: '' }
}

export function draftsOf(item: MenuItem | undefined): GroupDraft[] {
  return (item?.modifier_groups ?? []).map((group) => ({
    key: newDraftKey(),
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
    return failure('Una opción no tiene nombre')
  }
  const price = rawPrice === '' ? '0' : rawPrice.replace(',', '.')
  if (!PRICE.test(price)) {
    return failure(`El precio de «${rawName}» no es válido`)
  }
  return { ok: true, value: { name: rawName, price: price } }
}

function parseGroup(draft: GroupDraft): Parsed<ParsedGroup> {
  const name = draft.name.trim()
  if (name === '') {
    return failure('Cada grupo de opciones necesita un nombre')
  }
  const options: ParsedOption[] = []
  for (const line of draft.options.split('\n').filter((text) => text.trim() !== '')) {
    const option = parseOption(line)
    if (!option.ok) {
      return failure(`${name}: ${option.error}`)
    }
    options.push(option.value)
  }
  if (options.length === 0) {
    return failure(`${name}: escribe al menos una opción`)
  }
  const max = Math.min(Math.max(Number.parseInt(draft.max, 10) || 1, 1), options.length)
  return {
    ok: true,
    value: { name: name, min_choices: draft.required ? 1 : 0, max_choices: max, options: options },
  }
}

/** Los grupos listos para el API, o el primer error para mostrarlo. */
export function parseGroups(drafts: readonly GroupDraft[]): Parsed<ParsedGroup[]> {
  const groups: ParsedGroup[] = []
  for (const draft of drafts) {
    const group = parseGroup(draft)
    if (!group.ok) {
      return failure(group.error)
    }
    groups.push(group.value)
  }
  return { ok: true, value: groups }
}
