import { describe, expect, it } from '@jest/globals'
import { screen, waitFor } from '@testing-library/react'

import { entrarComo, montarRutas, PERMISOS_ENCARGADO, PERMISOS_MESERO, servidor } from '#jest/harness'
import router from './index'

function abrir(en: string) {
  return montarRutas(router.routes, en)
}

describe('guardas de las rutas', () => {
  it('sin sesión, una pantalla protegida lleva al acceso', async () => {
    servidor()
    const { router: enMemoria } = abrir('/caja')
    await waitFor(() => {
      expect(enMemoria.state.location.pathname).toBe('/acceso')
    })
    expect(await screen.findByRole('button', { name: /entrar/i })).toBeInTheDocument()
  })

  it('el mesero no entra a la caja: vuelve al inicio y cae en Pedidos', async () => {
    servidor().on('get', '/orders', [])
    entrarComo(PERMISOS_MESERO)
    const { router: enMemoria } = abrir('/caja')
    await waitFor(() => {
      expect(enMemoria.state.location.pathname).toBe('/pedidos')
    })
  })

  it('el encargado abre la caja', async () => {
    servidor()
    entrarComo(PERMISOS_ENCARGADO)
    const { router: enMemoria } = abrir('/caja')
    await waitFor(() => {
      expect(enMemoria.state.location.pathname).toBe('/caja')
    })
    expect(await screen.findByRole('heading', { name: /caja/i, level: 1 }, { timeout: 8000 })).toBeInTheDocument()
  })
})
