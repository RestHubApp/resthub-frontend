import { describe, expect, it } from '@jest/globals'

import { byName, removeFromList, upsertInList } from './cacheList'

interface Dish {
  readonly id: number
  readonly name: string
  readonly price?: string
}

const LIST: readonly Dish[] = [
  { id: 1, name: 'Ají de gallina' },
  { id: 2, name: 'Causa' },
  { id: 3, name: 'Lomo saltado' },
]

describe('cambios sobre una lista del caché', () => {
  it('un elemento nuevo entra en su lugar por nombre', () => {
    const list = upsertInList(LIST, { id: 9, name: 'Ceviche' }, byName)
    expect(list.map((p) => p.name)).toEqual(['Ají de gallina', 'Causa', 'Ceviche', 'Lomo saltado'])
  })

  it('si no hay uno que deba seguirle, va al final', () => {
    const list = upsertInList(LIST, { id: 9, name: 'Tacu tacu' }, byName)
    expect(list.at(-1)?.id).toBe(9)
  })

  it('uno que ya estaba y no cambió de lugar se actualiza donde está', () => {
    const list = upsertInList(LIST, { id: 2, name: 'Causa', price: '18.00' }, byName)
    expect(list).toHaveLength(3)
    expect(list[1]).toEqual({ id: 2, name: 'Causa', price: '18.00' })
  })

  it('si su orden cambió, sale de su lugar y entra en el nuevo', () => {
    const renamed = { id: 1, name: 'Tallarín verde' }
    const list = upsertInList(LIST, renamed, byName, (previous) => previous.name === renamed.name)
    expect(list.map((p) => p.id)).toEqual([2, 3, 1])
  })

  it('quitar deja la lista sin ese id y no cambia la original', () => {
    expect(removeFromList(LIST, 2).map((p) => p.id)).toEqual([1, 3])
    expect(LIST).toHaveLength(3)
  })

  it('byName ordena con las reglas del español', () => {
    expect(byName({ name: 'ñandú' }, { name: 'oca' })).toBe(true)
    expect(byName({ name: 'Zapallo' }, { name: 'ají' })).toBe(false)
  })
})
