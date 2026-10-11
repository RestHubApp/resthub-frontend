import { afterEach, describe, expect, it } from '@jest/globals'
import { act, renderHook } from '@testing-library/react'

import { buildMenu, dish, section } from '#jest/fixtures/orders'
import { cartTotals } from './cartTotals'
import { visibleSections } from './menuFilter'
import { MAX_QUANTITY } from '@/features/orders/quantityLimit'
import { lineKeyFor, toNewItems, useDraftActions, useDraftLines } from './useOrderDraft'

const TABLE_KEY = 'mesa-3'
const LOMO = dish()
const JUG = { group: 'Tamaño', option: 'Jarra', price: '12.00' }
const LIMON = { group: 'Extras', option: 'Limón', price: '0.50' }

function draft(tableKey = TABLE_KEY) {
  return renderHook(() => ({ lines: useDraftLines(tableKey), ...useDraftActions() }))
}

afterEach(() => {
  const { result } = draft()
  act(() => {
    result.current.clear(TABLE_KEY)
    result.current.clear('llevar')
  })
})

describe('lineKeyFor', () => {
  it('el mismo plato con las mismas opciones es la misma línea, en cualquier orden', () => {
    expect(lineKeyFor(21)).toBe('21')
    expect(lineKeyFor(21, [JUG, LIMON])).toBe(lineKeyFor(21, [LIMON, JUG]))
    expect(lineKeyFor(21, [JUG])).not.toBe(lineKeyFor(21, [LIMON]))
  })
})

describe('borrador del pedido', () => {
  it('tocar dos veces un plato suma uno, y las opciones hacen otra línea con su precio', () => {
    const { result } = draft()
    const chicha = dish({ id: 21, name: 'Chicha morada', price: '8.00' })
    act(() => {
      result.current.add(TABLE_KEY, LOMO)
      result.current.add(TABLE_KEY, LOMO)
      result.current.add(TABLE_KEY, chicha, [JUG, LIMON])
    })
    expect(result.current.lines.map((line) => [line.name, line.quantity, line.unitPrice])).toEqual([
      ['Lomo saltado', 2, '32.00'],
      ['Chicha morada', 1, '20.50'],
    ])
  })

  it('la cantidad no pasa del tope del servidor y en cero quita el plato', () => {
    const { result } = draft()
    act(() => {
      result.current.add(TABLE_KEY, LOMO)
      result.current.setQuantity(TABLE_KEY, '11', 500)
    })
    expect(result.current.lines[0]?.quantity).toBe(MAX_QUANTITY)
    act(() => {
      result.current.add(TABLE_KEY, LOMO)
    })
    expect(result.current.lines[0]?.quantity).toBe(MAX_QUANTITY)
    act(() => {
      result.current.setQuantity(TABLE_KEY, '11', 0)
    })
    expect(result.current.lines).toEqual([])
  })

  it('cada mesa tiene su borrador y limpiar uno no toca el otro', () => {
    const { result } = draft()
    const takeaway = draft('llevar')
    act(() => {
      result.current.add(TABLE_KEY, LOMO)
      result.current.add('llevar', LOMO)
      result.current.setNotes(TABLE_KEY, '11', '  sin cebolla ')
      result.current.clear('llevar')
    })
    expect(takeaway.result.current.lines).toEqual([])
    expect(toNewItems(result.current.lines)).toEqual([{ menu_item_id: 11, quantity: 1, notes: 'sin cebolla', modifiers: [] }])
  })

  it('al API viajan solo el grupo y la opción de cada extra', () => {
    const { result } = draft()
    act(() => {
      result.current.add(TABLE_KEY, dish({ id: 21 }), [JUG])
    })
    expect(toNewItems(result.current.lines)[0]?.modifiers).toEqual([{ group: 'Tamaño', option: 'Jarra' }])
  })
})

describe('cartTotals', () => {
  it('suma platos y soles en centavos', () => {
    const { result } = draft()
    act(() => {
      result.current.add(TABLE_KEY, dish({ price: '10.10' }))
      result.current.setQuantity(TABLE_KEY, '11', 3)
      result.current.add(TABLE_KEY, dish({ id: 12, price: '0.20' }))
    })
    const { dishes, count, total } = cartTotals(result.current.lines)
    expect([dishes, count]).toEqual([4, '4 platos'])
    // Intl separa «S/» del monto con un espacio duro.
    expect(total.replace(/\s/gu, ' ')).toBe('S/ 30.50')
  })
})

describe('visibleSections', () => {
  const sections = buildMenu().categories

  it('sin búsqueda muestra la categoría elegida, o la carta entera', () => {
    expect(visibleSections(sections, '', null).map((s) => s.name)).toEqual(['Fondos', 'Bebidas'])
    expect(visibleSections(sections, '', 2).map((s) => s.name)).toEqual(['Bebidas'])
  })

  it('la búsqueda ignora tildes, mayúsculas y la categoría elegida', () => {
    const result = visibleSections(sections, '  AJI ', 2)
    expect(result.flatMap((s) => s.items).map((i) => i.name)).toEqual(['Ají de gallina'])
    expect(result).toHaveLength(1)
  })

  it('no muestra categorías ni platos inactivos, ni secciones que quedan vacías', () => {
    const withInactive = [
      section({ id: 3, name: 'Postres', is_active: false }),
      section({ id: 4, name: 'Entradas', items: [dish({ is_active: false })] }),
      ...sections,
    ]
    expect(visibleSections(withInactive, '', null).map((s) => s.name)).toEqual(['Fondos', 'Bebidas'])
  })
})
