import { describe, expect, it } from '@jest/globals'

import { entrarComo, PERMISOS_MESERO, servidor } from '#jest/harness'
import { queryClient } from '../../services/queryClient'
import { cashAmountForApi, closeCashSchema, MAX_CASH_NOTES, openCashSchema } from './cashSchema'
import { prefetchCash } from './prefetchCash'

describe('esquemas de caja', () => {
  it('acepta cero, enteros y hasta dos decimales con punto o coma', () => {
    for (const monto of ['0', '150', '150.5', '150,50', ' 99.99 ']) {
      expect(openCashSchema.safeParse({ opening_amount: monto, notes: '' }).success).toBe(true)
    }
  })

  it('rechaza montos vacíos, negativos, con tres decimales o con letras', () => {
    const problemas = ['', '-5', '1.234', 'diez', '123456789'].map(
      (monto) => closeCashSchema.safeParse({ counted_cash: monto, notes: '' }).error?.issues[0]?.message,
    )
    const formato = 'Escribe un monto como 150 o 150.50'
    expect(problemas).toEqual(['Escribe el monto', formato, formato, formato, formato])
  })

  it('la nota no pasa del tope del servidor', () => {
    const larga = 'x'.repeat(MAX_CASH_NOTES + 1)
    expect(openCashSchema.safeParse({ opening_amount: '1', notes: larga }).success).toBe(false)
    expect(openCashSchema.safeParse({ opening_amount: '1', notes: 'x'.repeat(MAX_CASH_NOTES) }).success).toBe(true)
  })

  it('el monto viaja al API con punto decimal y sin espacios', () => {
    expect(cashAmountForApi(' 150,50 ')).toBe('150.50')
    expect(cashAmountForApi('20')).toBe('20')
  })
})

describe('prefetchCash', () => {
  it('el encargado adelanta la caja actual y la primera página de turnos', async () => {
    const api = servidor().on('get', '/cash/current', { is_open: false, session: null }).on('get', '/cash/sessions', { items: [], total: 0 })
    entrarComo()
    prefetchCash()
    await queryClient.getQueryCache().find({ queryKey: ['cash', 'current'] })?.promise
    expect(api.peticiones.map((p) => p.url).sort((a, b) => a.localeCompare(b))).toEqual(['/cash/current', '/cash/sessions'])
  })

  it('sin permiso de caja no pide nada', () => {
    const api = servidor()
    entrarComo(PERMISOS_MESERO)
    prefetchCash()
    expect(api.peticiones).toHaveLength(0)
  })
})
