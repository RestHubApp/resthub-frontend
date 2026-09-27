import { describe, expect, it } from '@jest/globals'
import { waitFor } from '@testing-library/react'

import { carta, plato } from '#jest/fixtures/inventario'
import { entrarComo, PERMISOS_MESERO, servidor } from '#jest/harness'
import { patchItem, withCategory, withCategoryOrder, withItem, withItemOrder, withoutCategory } from './menuCache'
import { moveId, sortByIds } from './menuOrder'
import { emptyMenuItem, menuItemPayload, menuItemSchema, menuItemValuesOf } from './menuSchema'
import { prefetchMenu } from './prefetchMenu'

const ENTRADAS = 'Entradas:Ceviche,Causa'
const CATEGORIA = { id: 3, name: 'Postres', position: 2, is_active: true, created_at: '2026-09-26T13:00:00Z' }

function urls(api: { peticiones: readonly { url: string }[] }): string[] {
  return api.peticiones.map((p) => p.url).sort((a, b) => a.localeCompare(b))
}

function nombres(menu: ReturnType<typeof carta>) {
  return menu.categories.map((c) => `${c.name}:${c.items.map((p) => p.name).join(',')}`)
}

describe('menuOrder', () => {
  it('mueve un id un lugar y deja la lista igual en los bordes o si no está', () => {
    expect(moveId([1, 2, 3], 2, 'up')).toEqual([2, 1, 3])
    expect(moveId([1, 2, 3], 2, 'down')).toEqual([1, 3, 2])
    expect(moveId([1, 2, 3], 1, 'up')).toEqual([1, 2, 3])
    expect(moveId([1, 2, 3], 3, 'down')).toEqual([1, 2, 3])
    expect(moveId([1, 2, 3], 9, 'up')).toEqual([1, 2, 3])
  })

  it('ordena por los ids sin tocar la lista original', () => {
    const lista = [{ id: 1 }, { id: 2 }, { id: 3 }]
    expect(sortByIds(lista, [3, 1, 2]).map((x) => x.id)).toEqual([3, 1, 2])
    expect(lista.map((x) => x.id)).toEqual([1, 2, 3])
  })
})

describe('menuCache', () => {
  it('cambia solo el plato indicado', () => {
    const menu = patchItem(carta(), 11, { is_available: true })
    expect(menu.categories[0]?.items.map((p) => p.is_available)).toEqual([true, true])
  })

  it('reordena categorías y platos de una categoría', () => {
    expect(nombres(withCategoryOrder(carta(), [2, 1]))).toEqual(['Bebidas:', ENTRADAS])
    expect(nombres(withItemOrder(carta(), 1, [11, 10]))[0]).toBe('Entradas:Causa,Ceviche')
  })

  it('un plato nuevo entra al final de su categoría y uno movido sale de la anterior', () => {
    expect(nombres(withItem(carta(), plato({ id: 12, name: 'Chicha', category_id: 2 })))).toEqual([
      ENTRADAS,
      'Bebidas:Chicha',
    ])
    expect(nombres(withItem(carta(), plato({ category_id: 2 })))).toEqual(['Entradas:Causa', 'Bebidas:Ceviche'])
    expect(withItem(carta(), plato({ price: '32.00' })).categories[0]?.items[0]?.price).toBe('32.00')
  })

  it('una categoría nueva va al final vacía; una existente se renombra conservando sus platos', () => {
    expect(nombres(withCategory(carta(), CATEGORIA))).toEqual([ENTRADAS, 'Bebidas:', 'Postres:'])
    expect(nombres(withCategory(carta(), { ...CATEGORIA, id: 1, name: 'Piqueos' }))[0]).toBe('Piqueos:Ceviche,Causa')
    expect(nombres(withoutCategory(carta(), 2))).toEqual([ENTRADAS])
  })
})

describe('menuSchema', () => {
  it('arma el cuerpo del API con el precio con punto', () => {
    expect(menuItemPayload({ category_id: '2', name: 'Chicha', description: '', price: ' 6,50 ' })).toEqual({
      category_id: 2,
      name: 'Chicha',
      description: '',
      price: '6.50',
    })
  })

  it('parte de un formulario vacío o de los datos del plato', () => {
    expect(emptyMenuItem(undefined).category_id).toBe('')
    expect(emptyMenuItem(4).category_id).toBe('4')
    expect(menuItemValuesOf(plato())).toEqual({ category_id: '1', name: 'Ceviche', description: plato().description, price: '30.00' })
  })

  it('rechaza un precio de tres decimales o fuera de rango', () => {
    const base = { category_id: '1', name: 'Ceviche', description: '' }
    expect(menuItemSchema.safeParse({ ...base, price: '30.505' }).success).toBe(false)
    expect(menuItemSchema.safeParse({ ...base, price: '10000' }).success).toBe(false)
    expect(menuItemSchema.safeParse({ ...base, price: '0' }).success).toBe(false)
    expect(menuItemSchema.safeParse({ ...base, price: '29,90' }).success).toBe(true)
  })
})

describe('prefetchMenu', () => {
  it('el encargado adelanta la carta y los costos', async () => {
    const api = servidor().on('get', '/menu', carta()).on('get', '/inventory/recipes', [])
    entrarComo()
    prefetchMenu()
    await waitFor(() => {
      expect(urls(api)).toEqual(['/inventory/recipes', '/menu'])
    })
  })

  it('el mesero adelanta la carta pero no los costos del inventario', async () => {
    const api = servidor().on('get', '/menu', carta())
    entrarComo(PERMISOS_MESERO)
    prefetchMenu()
    await waitFor(() => {
      expect(urls(api)).toEqual(['/menu'])
    })
  })
})
