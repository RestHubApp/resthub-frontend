import { describe, expect, it } from 'vitest'

import { COMMON_TIME_ZONES, isValidTimeZone, timeZoneLabel, timeZoneOptions } from './timeZones'

const LIMA = 'America/Lima'
const TOKIO = 'Asia/Tokyo'

describe('COMMON_TIME_ZONES', () => {
  it('empieza por Lima y todas son zonas válidas, sin repetir', () => {
    expect(COMMON_TIME_ZONES[0]?.value).toBe(LIMA)
    const valores = COMMON_TIME_ZONES.map((zona) => zona.value)
    expect(new Set(valores).size).toBe(valores.length)
    expect(valores.every(isValidTimeZone)).toBe(true)
  })
})

describe('isValidTimeZone', () => {
  it('acepta nombres de IANA escritos como los guarda el servidor', () => {
    expect(isValidTimeZone('America/Argentina/Buenos_Aires')).toBe(true)
    expect(isValidTimeZone('UTC')).toBe(true)
    expect(isValidTimeZone('Etc/GMT+5')).toBe(true)
  })

  it('acepta los alias de IANA que el navegador conoce', () => {
    for (const alias of ['GMT', 'UCT', 'Zulu', 'EST5EDT', 'US/Pacific', 'Asia/Calcutta']) {
      expect(isValidTimeZone(alias)).toBe(true)
    }
  })

  it('rechaza zonas inventadas, mal escritas, desfases sueltos o demasiado largas', () => {
    for (const mala of ['America/Atlantida', 'america/lima', 'utc', 'Lima', '+05:00', '', `America/${'A'.repeat(64)}`]) {
      expect(isValidTimeZone(mala)).toBe(false)
    }
  })
})

describe('timeZoneOptions', () => {
  it('agrega la zona actual si no es de las comunes', () => {
    expect(timeZoneOptions(TOKIO)[0]).toEqual({ value: TOKIO, label: TOKIO })
    expect(timeZoneOptions(LIMA)).toBe(COMMON_TIME_ZONES)
    expect(timeZoneOptions()).toBe(COMMON_TIME_ZONES)
  })

  it('muestra el nombre para leer junto al de IANA', () => {
    expect(timeZoneLabel({ value: LIMA, label: 'Lima (Perú)' })).toBe('Lima (Perú) · America/Lima')
    expect(timeZoneLabel({ value: 'UTC', label: 'UTC' })).toBe('UTC')
  })
})
