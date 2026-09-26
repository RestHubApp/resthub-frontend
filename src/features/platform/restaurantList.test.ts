import { describe, expect, it } from 'vitest'

import { activityParams, pageCount, restaurantListParams, staffSummary } from './restaurantList'

describe('restaurantListParams', () => {
  it('pide la página con su desplazamiento y sin filtro si no hay texto', () => {
    expect(restaurantListParams('  ', 0)).toEqual({ limit: 25, offset: 0 })
    expect(restaurantListParams(' esquina ', 2)).toEqual({ limit: 25, offset: 50, search: 'esquina' })
  })

  it('la bitácora pagina igual', () => {
    expect(activityParams(1)).toEqual({ limit: 25, offset: 25 })
  })
})

describe('pageCount', () => {
  it('tiene al menos una página', () => {
    expect(pageCount(0)).toBe(1)
    expect(pageCount(25)).toBe(1)
    expect(pageCount(26)).toBe(2)
  })
})

describe('staffSummary', () => {
  it('dice cuántas cuentas pueden entrar', () => {
    expect(staffSummary(0, 0)).toBe('Sin cuentas')
    expect(staffSummary(1, 1)).toBe('1 de 1 activa')
    expect(staffSummary(3, 4)).toBe('3 de 4 activas')
  })
})
