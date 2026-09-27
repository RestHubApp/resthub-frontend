import { afterEach, describe, expect, it } from '@jest/globals'
import { act, renderHook } from '@testing-library/react'

import { carta, plato, seccion } from '#jest/fixtures/pedidos'
import { cartTotals } from './cartTotals'
import { visibleSections } from './menuFilter'
import { lineKeyFor, MAX_QUANTITY, toNewItems, useDraftActions, useDraftLines } from './useOrderDraft'

const CLAVE = 'mesa-3'
const LOMO = plato()
const JARRA = { group: 'Tamaño', option: 'Jarra', price: '12.00' }
const LIMON = { group: 'Extras', option: 'Limón', price: '0.50' }

function borrador(clave = CLAVE) {
  return renderHook(() => ({ lines: useDraftLines(clave), ...useDraftActions() }))
}

afterEach(() => {
  const { result } = borrador()
  act(() => {
    result.current.clear(CLAVE)
    result.current.clear('llevar')
  })
})

describe('lineKeyFor', () => {
  it('el mismo plato con las mismas opciones es la misma línea, en cualquier orden', () => {
    expect(lineKeyFor(21)).toBe('21')
    expect(lineKeyFor(21, [JARRA, LIMON])).toBe(lineKeyFor(21, [LIMON, JARRA]))
    expect(lineKeyFor(21, [JARRA])).not.toBe(lineKeyFor(21, [LIMON]))
  })
})

describe('borrador del pedido', () => {
  it('tocar dos veces un plato suma uno, y las opciones hacen otra línea con su precio', () => {
    const { result } = borrador()
    const chicha = plato({ id: 21, name: 'Chicha morada', price: '8.00' })
    act(() => {
      result.current.add(CLAVE, LOMO)
      result.current.add(CLAVE, LOMO)
      result.current.add(CLAVE, chicha, [JARRA, LIMON])
    })
    expect(result.current.lines.map((line) => [line.name, line.quantity, line.unitPrice])).toEqual([
      ['Lomo saltado', 2, '32.00'],
      ['Chicha morada', 1, '20.50'],
    ])
  })

  it('la cantidad no pasa del tope del servidor y en cero quita el plato', () => {
    const { result } = borrador()
    act(() => {
      result.current.add(CLAVE, LOMO)
      result.current.setQuantity(CLAVE, '11', 500)
    })
    expect(result.current.lines[0]?.quantity).toBe(MAX_QUANTITY)
    act(() => {
      result.current.add(CLAVE, LOMO)
    })
    expect(result.current.lines[0]?.quantity).toBe(MAX_QUANTITY)
    act(() => {
      result.current.setQuantity(CLAVE, '11', 0)
    })
    expect(result.current.lines).toEqual([])
  })

  it('cada mesa tiene su borrador y limpiar uno no toca el otro', () => {
    const { result } = borrador()
    const llevar = borrador('llevar')
    act(() => {
      result.current.add(CLAVE, LOMO)
      result.current.add('llevar', LOMO)
      result.current.setNotes(CLAVE, '11', '  sin cebolla ')
      result.current.clear('llevar')
    })
    expect(llevar.result.current.lines).toEqual([])
    expect(toNewItems(result.current.lines)).toEqual([{ menu_item_id: 11, quantity: 1, notes: 'sin cebolla', modifiers: [] }])
  })

  it('al API viajan solo el grupo y la opción de cada extra', () => {
    const { result } = borrador()
    act(() => {
      result.current.add(CLAVE, plato({ id: 21 }), [JARRA])
    })
    expect(toNewItems(result.current.lines)[0]?.modifiers).toEqual([{ group: 'Tamaño', option: 'Jarra' }])
  })
})

describe('cartTotals', () => {
  it('suma platos y soles en centavos', () => {
    const { result } = borrador()
    act(() => {
      result.current.add(CLAVE, plato({ price: '10.10' }))
      result.current.setQuantity(CLAVE, '11', 3)
      result.current.add(CLAVE, plato({ id: 12, price: '0.20' }))
    })
    const { platos, count, total } = cartTotals(result.current.lines)
    expect([platos, count]).toEqual([4, '4 platos'])
    // Intl separa «S/» del monto con un espacio duro.
    expect(total.replace(/\s/gu, ' ')).toBe('S/ 30.50')
  })
})

describe('visibleSections', () => {
  const secciones = carta().categories

  it('sin búsqueda muestra la categoría elegida, o la carta entera', () => {
    expect(visibleSections(secciones, '', null).map((s) => s.name)).toEqual(['Fondos', 'Bebidas'])
    expect(visibleSections(secciones, '', 2).map((s) => s.name)).toEqual(['Bebidas'])
  })

  it('la búsqueda ignora tildes, mayúsculas y la categoría elegida', () => {
    const resultado = visibleSections(secciones, '  AJI ', 2)
    expect(resultado.flatMap((s) => s.items).map((i) => i.name)).toEqual(['Ají de gallina'])
    expect(resultado).toHaveLength(1)
  })

  it('no muestra categorías ni platos inactivos, ni secciones que quedan vacías', () => {
    const conInactivos = [
      seccion({ id: 3, name: 'Postres', is_active: false }),
      seccion({ id: 4, name: 'Entradas', items: [plato({ is_active: false })] }),
      ...secciones,
    ]
    expect(visibleSections(conInactivos, '', null).map((s) => s.name)).toEqual(['Fondos', 'Bebidas'])
  })
})
