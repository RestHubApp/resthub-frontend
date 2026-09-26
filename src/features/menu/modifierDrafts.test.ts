import { describe, expect, it } from 'vitest'

import type { MenuItem } from '../../api/types'
import { draftsOf, type GroupDraft, parseGroups } from './modifierDrafts'

const tamano: GroupDraft = { name: 'Tamaño', required: true, max: '1', options: 'Personal\nFamiliar = 10,50\n' }

describe('parseGroups', () => {
  it('lee una opción por línea con su precio adicional', () => {
    const resultado = parseGroups([tamano])
    expect(resultado).toEqual({
      ok: true,
      value: [
        {
          name: 'Tamaño',
          min_choices: 1,
          max_choices: 1,
          options: [
            { name: 'Personal', price: '0' },
            { name: 'Familiar', price: '10.50' },
          ],
        },
      ],
    })
  })

  it('el máximo no pasa de la cantidad de opciones', () => {
    const resultado = parseGroups([{ ...tamano, required: false, max: '9' }])
    expect(resultado.ok && resultado.value[0]?.max_choices).toBe(2)
  })

  it('avisa el primer error: grupo sin nombre, sin opciones o precio mal escrito', () => {
    expect(parseGroups([{ ...tamano, name: ' ' }])).toEqual({ ok: false, error: 'Cada grupo de opciones necesita un nombre' })
    expect(parseGroups([{ ...tamano, options: '\n' }])).toEqual({ ok: false, error: 'Tamaño: escribe al menos una opción' })
    expect(parseGroups([{ ...tamano, options: 'Familiar = diez' }])).toEqual({
      ok: false,
      error: 'Tamaño: El precio de «Familiar» no es válido',
    })
  })
})

describe('draftsOf', () => {
  it('vuelve a escribir los grupos guardados como texto', () => {
    const plato = {
      modifier_groups: [
        {
          name: 'Salsa',
          min_choices: 0,
          max_choices: 2,
          options: [
            { name: 'Ají', price: '0.00' },
            { name: 'Queso', price: '2.00' },
          ],
        },
      ],
    } as unknown as MenuItem
    expect(draftsOf(plato)).toEqual([{ name: 'Salsa', required: false, max: '2', options: 'Ají\nQueso = 2.00' }])
    expect(draftsOf(undefined)).toEqual([])
  })
})
