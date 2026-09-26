import { create } from 'zustand'

import type { NewItemRequest, OrderMenuItem } from '../../../api/types'
import { centsToApi, toCents } from '../../../services/format'

/** Una opción elegida de un grupo del plato, con lo que suma al precio. */
export interface DraftModifier {
  readonly group: string
  readonly option: string
  readonly price: string
}

export interface DraftLine {
  /** El plato con sus opciones: dos lomos con distintos extras son dos líneas. */
  readonly lineKey: string
  readonly menuItemId: number
  readonly name: string
  /** Con las opciones ya sumadas. */
  readonly unitPrice: string
  readonly quantity: number
  readonly notes: string
  readonly modifiers: readonly DraftModifier[]
}

interface DraftState {
  readonly drafts: Readonly<Record<string, readonly DraftLine[]>>
  add: (key: string, item: OrderMenuItem, modifiers?: readonly DraftModifier[]) => void
  setQuantity: (key: string, lineKey: string, quantity: number) => void
  setNotes: (key: string, lineKey: string, notes: string) => void
  clear: (key: string) => void
}

// El mismo tope que el servidor.
export const MAX_QUANTITY = 99
const EMPTY: readonly DraftLine[] = []

/** La clave de una línea: el plato y sus opciones, en un orden fijo. */
export function lineKeyFor(menuItemId: number, modifiers: readonly DraftModifier[] = []): string {
  const firma = modifiers
    .map((modifier) => `${modifier.group}:${modifier.option}`)
    .sort((a, b) => a.localeCompare(b))
    .join('|')
  return firma === '' ? String(menuItemId) : `${String(menuItemId)}|${firma}`
}

function update(
  lines: readonly DraftLine[],
  lineKey: string,
  change: (line: DraftLine) => DraftLine | null,
): DraftLine[] {
  return lines.flatMap((line) => {
    if (line.lineKey !== lineKey) {
      return [line]
    }
    const next = change(line)
    return next === null ? [] : [next]
  })
}

function newLine(item: OrderMenuItem, modifiers: readonly DraftModifier[]): DraftLine {
  const extra = modifiers.reduce((suma, modifier) => suma + toCents(modifier.price), 0)
  return {
    lineKey: lineKeyFor(item.id, modifiers),
    menuItemId: item.id,
    name: item.name,
    unitPrice: centsToApi(toCents(item.price) + extra),
    quantity: 1,
    notes: '',
    modifiers,
  }
}

/**
 * Los pedidos a medio tomar, uno por mesa, por "para llevar" o por pedido.
 *
 * Vive fuera de la pantalla para que el mesero pueda volver al salon a mirar
 * otra mesa y, al regresar, encontrar lo que ya habia marcado. Solo dura lo
 * que dura la pestana: un borrador olvidado no tiene que reaparecer manana.
 */
const useDraftStore = create<DraftState>((set) => ({
  drafts: {},

  add: (key, item, modifiers = []) => {
    set((state) => {
      const lines = state.drafts[key] ?? EMPTY
      const lineKey = lineKeyFor(item.id, modifiers)
      const exists = lines.some((line) => line.lineKey === lineKey)
      const next = exists
        ? update(lines, lineKey, (line) => ({
            ...line,
            quantity: Math.min(line.quantity + 1, MAX_QUANTITY),
          }))
        : [...lines, newLine(item, modifiers)]
      return { drafts: { ...state.drafts, [key]: next } }
    })
  },

  setQuantity: (key, lineKey, quantity) => {
    set((state) => ({
      drafts: {
        ...state.drafts,
        [key]: update(state.drafts[key] ?? EMPTY, lineKey, (line) =>
          quantity <= 0 ? null : { ...line, quantity: Math.min(quantity, MAX_QUANTITY) },
        ),
      },
    }))
  },

  setNotes: (key, lineKey, notes) => {
    set((state) => ({
      drafts: {
        ...state.drafts,
        [key]: update(state.drafts[key] ?? EMPTY, lineKey, (line) => ({ ...line, notes })),
      },
    }))
  },

  clear: (key) => {
    set((state) => {
      const rest = Object.fromEntries(
        Object.entries(state.drafts).filter(([draft]) => draft !== key),
      )
      return { drafts: rest }
    })
  },
}))

export function useDraftLines(key: string): readonly DraftLine[] {
  return useDraftStore((state) => state.drafts[key] ?? EMPTY)
}

export function useDraftActions() {
  const add = useDraftStore((state) => state.add)
  const setQuantity = useDraftStore((state) => state.setQuantity)
  const setNotes = useDraftStore((state) => state.setNotes)
  const clear = useDraftStore((state) => state.clear)
  return { add, setQuantity, setNotes, clear }
}

export function toNewItems(lines: readonly DraftLine[]): NewItemRequest[] {
  return lines.map((line) => ({
    menu_item_id: line.menuItemId,
    quantity: line.quantity,
    notes: line.notes.trim(),
    modifiers: line.modifiers.map((modifier) => ({ group: modifier.group, option: modifier.option })),
  }))
}
