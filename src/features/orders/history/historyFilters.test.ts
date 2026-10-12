import { describe, expect, it } from '@jest/globals'

import { PAGE_SIZE, toParams } from './historyFilters'

describe('toParams', () => {
  it('sin filtros no manda ninguno y pide la primera página', () => {
    expect(toParams({ from: '', to: '', status: '', type: '', waiterId: '' }, 0)).toEqual({
      date_from: null,
      date_to: null,
      status: null,
      type: null,
      waiter_id: null,
      limit: PAGE_SIZE,
      offset: 0,
    })
  })

  it('manda el estado como lista, el mesero como número y la página como desplazamiento', () => {
    const params = toParams({ from: '2026-09-01', to: '2026-09-26', status: 'paid', type: 'delivery', waiterId: '7' }, 2)

    expect(params).toEqual({
      date_from: '2026-09-01',
      date_to: '2026-09-26',
      status: ['paid'],
      type: 'delivery',
      waiter_id: 7,
      limit: 25,
      offset: 50,
    })
  })
})
