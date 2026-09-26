import { describe, expect, it } from 'vitest'

import { AUTO_REFRESH_MS, refreshInterval, refreshStatus } from './autoRefresh'

describe('refreshInterval', () => {
  it('relee cada 30 s solo con la pestaña a la vista y sin pausa', () => {
    expect(refreshInterval(false, 'visible')).toBe(AUTO_REFRESH_MS)
    expect(AUTO_REFRESH_MS).toBe(30_000)
  })

  it('no relee en pausa ni con la pestaña oculta', () => {
    expect(refreshInterval(true, 'visible')).toBe(false)
    expect(refreshInterval(false, 'hidden')).toBe(false)
    expect(refreshInterval(true, 'hidden')).toBe(false)
  })
})

describe('refreshStatus', () => {
  it('dice por qué no se actualiza', () => {
    expect(refreshStatus(true, 'visible')).toBe('Actualización en pausa')
    expect(refreshStatus(false, 'hidden')).toBe('En espera mientras la pestaña no está a la vista')
    expect(refreshStatus(false, 'visible')).toBe('Se actualiza cada 30 s')
  })
})
