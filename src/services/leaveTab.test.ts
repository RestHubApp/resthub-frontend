import { describe, expect, it } from '@jest/globals'

import { appUrl } from './leaveTab'

describe('appUrl', () => {
  const PLATFORM = '/plataforma'

  it('antepone la base de la aplicación', () => {
    expect(appUrl(PLATFORM, '/')).toBe(PLATFORM)
    expect(appUrl(PLATFORM, '/app/')).toBe(`/app${PLATFORM}`)
  })

  it('acepta una ruta sin barra inicial y una base sin barra final', () => {
    expect(appUrl('vista-previa', '/app')).toBe('/app/vista-previa')
  })
})
