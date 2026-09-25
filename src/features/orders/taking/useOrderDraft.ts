import { create } from 'zustand'

import type { NewItemRequest, OrderMenuItem } from '../../../api/types'

export interface DraftLine {
  readonly menuItemId: number
  readonly name: string
  readonly unitPrice: string
  readonly quantity: number
  readonly notes: string
}

interface DraftState {
  readonly drafts: Readonly<Record<string, readonly DraftLine[]>>
  add: (key: string, item: OrderMenuItem) => void
  setQuantity: (key: string, menuItemId: number, quantity: number) => void
  setNotes: (key: string, menuItemId: number, notes: string) => void
  clear: (key: string) => void
}

// El mismo tope que el servidor.
export const MAX_QUANTITY = 99
const EMPTY: readonly DraftLine[] = []

function update(
  lines: readonly DraftLine[],
  menuItemId: number,
  change: (line: DraftLine) => DraftLine | null,
): DraftLine[] {
  return lines.flatMap((line) => {
    if (line.menuItemId !== menuItemId) {
      return [line]
    }
    const next = change(line)
    return next === null ? [] : [next]
  })
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

  add: (key, item) => {
    set((state) => {
      const lines = state.drafts[key] ?? EMPTY
      const exists = lines.some((line) => line.menuItemId === item.id)
      const next = exists
        ? update(lines, item.id, (line) => ({
            ...line,
            quantity: Math.min(line.quantity + 1, MAX_QUANTITY),
          }))
        : [
            ...lines,
            { menuItemId: item.id, name: item.name, unitPrice: item.price, quantity: 1, notes: '' },
          ]
      return { drafts: { ...state.drafts, [key]: next } }
    })
  },

  setQuantity: (key, menuItemId, quantity) => {
    set((state) => ({
      drafts: {
        ...state.drafts,
        [key]: update(state.drafts[key] ?? EMPTY, menuItemId, (line) =>
          quantity <= 0 ? null : { ...line, quantity: Math.min(quantity, MAX_QUANTITY) },
        ),
      },
    }))
  },

  setNotes: (key, menuItemId, notes) => {
    set((state) => ({
      drafts: {
        ...state.drafts,
        [key]: update(state.drafts[key] ?? EMPTY, menuItemId, (line) => ({ ...line, notes })),
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
  }))
}
