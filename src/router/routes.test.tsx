import { beforeAll, describe, expect, it } from '@jest/globals'
import { screen, waitFor } from '@testing-library/react'

import { entrarAPlataforma, entrarComo, montarRutas, PERMISOS_ENCARGADO, PERMISOS_MESERO, servidor } from '#jest/harness'
import { router } from './routes'

const PROFILE = '/perfil'
const CASH_REGISTER = '/caja'
const LOG = '/plataforma/bitacora'
const PLATFORM = /^\/platform\//u
const ME_IN_PLATFORM = { admin: { id: 1, email: 'plataforma@resthub.dev', full_name: 'Equipo RestHub' } }

function open(en: string) {
  return montarRutas(router.routes, en).router
}

async function arrivesTo(inMemory: ReturnType<typeof open>, route: string) {
  await waitFor(() => {
    expect(inMemory.state.location.pathname).toBe(route)
  })
}

// Las pantallas perezosas se compilan con Babel la primera vez que se abren;
// con la cobertura encendida y la máquina ocupada eso pasaba del plazo de una
// prueba. Se compilan antes, fuera del tiempo de cada caso.
beforeAll(async () => {
  await Promise.all([import('@/features/cash/CashView'), import('@/features/insights/InsightsView'), import('@/features/auth/ProfileView')])
}, 120_000)

describe('guardas de las rutas del restaurante', () => {
  it('sin sesión, una pantalla protegida lleva al acceso', async () => {
    servidor()
    await arrivesTo(open(CASH_REGISTER), '/acceso')
    expect(await screen.findByRole('button', { name: /entrar/i })).toBeInTheDocument()
  })

  it('el mesero no entra a la caja: vuelve al inicio y cae en Pedidos', async () => {
    servidor().on('get', '/orders', [])
    entrarComo(PERMISOS_MESERO)
    await arrivesTo(open(CASH_REGISTER), '/pedidos')
  })

  it('el encargado abre la caja', async () => {
    servidor()
    entrarComo(PERMISOS_ENCARGADO)
    await arrivesTo(open(CASH_REGISTER), CASH_REGISTER)
    expect(await screen.findByRole('heading', { name: /caja/i, level: 1 }, { timeout: 8000 })).toBeInTheDocument()
  })

  it('la guarda mira el permiso, no el rol: un rol con solo el panel entra al panel y no a la caja', async () => {
    servidor()
    entrarComo(['insights.read'], { user: { id: 9, email: 'bi@resthub.dev', full_name: 'Analista', role_id: 5, role_label: 'Encargado' } })
    await arrivesTo(open(CASH_REGISTER), '/panel')
  })

  it('una cuenta sin ninguna pantalla termina en su perfil', async () => {
    servidor()
    entrarComo([])
    await arrivesTo(open('/'), PROFILE)
    await arrivesTo(open('/inventario'), PROFILE)
  })

  it('una ruta que no existe lleva al inicio de la cuenta', async () => {
    servidor()
    entrarComo(PERMISOS_MESERO)
    await arrivesTo(open('/no-existe/de-verdad'), '/pedidos')
  })
})

describe('guarda del área de plataforma', () => {
  it('una sesión de restaurante no entra: pide el acceso de plataforma', async () => {
    servidor()
    entrarComo(PERMISOS_ENCARGADO)
    await arrivesTo(open(LOG), '/plataforma/acceso')
  })

  it('con la sesión de plataforma abre la pantalla pedida', async () => {
    servidor().on('get', PLATFORM, { items: [], total: 0 }).on('get', '/platform/auth/me', ME_IN_PLATFORM)
    entrarAPlataforma()
    await arrivesTo(open(LOG), LOG)
  })

  it('una ruta desconocida del área vuelve a su inicio', async () => {
    servidor().on('get', PLATFORM, { items: [], total: 0 }).on('get', '/platform/auth/me', ME_IN_PLATFORM)
    entrarAPlataforma()
    await arrivesTo(open('/plataforma/cualquier-cosa'), '/plataforma')
  })
})
