import { beforeAll, describe, expect, it } from '@jest/globals'
import { screen, waitFor } from '@testing-library/react'

import { entrarAPlataforma, entrarComo, montarRutas, PERMISOS_ENCARGADO, PERMISOS_MESERO, servidor } from '#jest/harness'
import router from './index'

const PERFIL = '/perfil'
const CAJA = '/caja'
const BITACORA = '/plataforma/bitacora'
const PLATAFORMA = /^\/platform\//u
const YO_EN_PLATAFORMA = { admin: { id: 1, email: 'plataforma@resthub.dev', full_name: 'Equipo RestHub' } }

function abrir(en: string) {
  return montarRutas(router.routes, en).router
}

async function llegaA(enMemoria: ReturnType<typeof abrir>, ruta: string) {
  await waitFor(() => {
    expect(enMemoria.state.location.pathname).toBe(ruta)
  })
}

// Las pantallas perezosas se compilan con Babel la primera vez que se abren;
// con la cobertura encendida y la máquina ocupada eso pasaba del plazo de una
// prueba. Se compilan antes, fuera del tiempo de cada caso.
beforeAll(async () => {
  await Promise.all([import('../features/cash/CashView'), import('../features/insights/InsightsView'), import('../features/auth/ProfileView')])
}, 120_000)

describe('guardas de las rutas del restaurante', () => {
  it('sin sesión, una pantalla protegida lleva al acceso', async () => {
    servidor()
    await llegaA(abrir(CAJA), '/acceso')
    expect(await screen.findByRole('button', { name: /entrar/i })).toBeInTheDocument()
  })

  it('el mesero no entra a la caja: vuelve al inicio y cae en Pedidos', async () => {
    servidor().on('get', '/orders', [])
    entrarComo(PERMISOS_MESERO)
    await llegaA(abrir(CAJA), '/pedidos')
  })

  it('el encargado abre la caja', async () => {
    servidor()
    entrarComo(PERMISOS_ENCARGADO)
    await llegaA(abrir(CAJA), CAJA)
    expect(await screen.findByRole('heading', { name: /caja/i, level: 1 }, { timeout: 8000 })).toBeInTheDocument()
  })

  it('la guarda mira el permiso, no el rol: un rol con solo el panel entra al panel y no a la caja', async () => {
    servidor()
    entrarComo(['insights.read'], { user: { id: 9, email: 'bi@resthub.dev', full_name: 'Analista', role_id: 5, role_label: 'Encargado' } })
    await llegaA(abrir(CAJA), '/panel')
  })

  it('una cuenta sin ninguna pantalla termina en su perfil', async () => {
    servidor()
    entrarComo([])
    await llegaA(abrir('/'), PERFIL)
    await llegaA(abrir('/inventario'), PERFIL)
  })

  it('una ruta que no existe lleva al inicio de la cuenta', async () => {
    servidor()
    entrarComo(PERMISOS_MESERO)
    await llegaA(abrir('/no-existe/de-verdad'), '/pedidos')
  })
})

describe('guarda del área de plataforma', () => {
  it('una sesión de restaurante no entra: pide el acceso de plataforma', async () => {
    servidor()
    entrarComo(PERMISOS_ENCARGADO)
    await llegaA(abrir(BITACORA), '/plataforma/acceso')
  })

  it('con la sesión de plataforma abre la pantalla pedida', async () => {
    servidor().on('get', PLATAFORMA, { items: [], total: 0 }).on('get', '/platform/auth/me', YO_EN_PLATAFORMA)
    entrarAPlataforma()
    await llegaA(abrir(BITACORA), BITACORA)
  })

  it('una ruta desconocida del área vuelve a su inicio', async () => {
    servidor().on('get', PLATAFORMA, { items: [], total: 0 }).on('get', '/platform/auth/me', YO_EN_PLATAFORMA)
    entrarAPlataforma()
    await llegaA(abrir('/plataforma/cualquier-cosa'), '/plataforma')
  })
})
