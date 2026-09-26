import { describe, expect, it } from 'vitest'

import { appUrl } from './leaveTab'

describe('appUrl', () => {
  const PLATAFORMA = '/plataforma'

  it('antepone la base de la aplicación', () => {
    expect(appUrl(PLATAFORMA, '/')).toBe(PLATAFORMA)
    expect(appUrl(PLATAFORMA, '/app/')).toBe(`/app${PLATAFORMA}`)
  })

  it('acepta una ruta sin barra inicial y una base sin barra final', () => {
    expect(appUrl('vista-previa', '/app')).toBe('/app/vista-previa')
  })
})
