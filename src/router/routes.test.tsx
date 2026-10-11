import { beforeAll, describe, expect, it } from '@jest/globals'
import { screen, waitFor } from '@testing-library/react'

import { signInToPlatform, signInAs, mountRoutes, PERMISSIONS_OWNER, PERMISSIONS_WAITER, server } from '#jest/harness'
import { router } from './routes'

const PROFILE = '/perfil'
const CASH_REGISTER = '/caja'
const LOG = '/plataforma/bitacora'
const PLATFORM = /^\/platform\//u
const ME_IN_PLATFORM = { admin: { id: 1, email: 'plataforma@resthub.dev', full_name: 'Equipo RestHub' } }

function open(en: string) {
  return mountRoutes(router.routes, en).router
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
    server()
    await arrivesTo(open(CASH_REGISTER), '/acceso')
    expect(await screen.findByRole('button', { name: /entrar/i })).toBeInTheDocument()
  })

  it('el mesero no entra a la caja: vuelve al inicio y cae en Pedidos', async () => {
    server().on('get', '/orders', [])
    signInAs(PERMISSIONS_WAITER)
    await arrivesTo(open(CASH_REGISTER), '/pedidos')
  })

  it('el encargado abre la caja', async () => {
    server()
    signInAs(PERMISSIONS_OWNER)
    await arrivesTo(open(CASH_REGISTER), CASH_REGISTER)
    expect(await screen.findByRole('heading', { name: /caja/i, level: 1 }, { timeout: 8000 })).toBeInTheDocument()
  })

  it('la guarda mira el permiso, no el rol: un rol con solo el panel entra al panel y no a la caja', async () => {
    server()
    signInAs(['insights.read'], { user: { id: 9, email: 'bi@resthub.dev', full_name: 'Analista', role_id: 5, role_label: 'Encargado' } })
    await arrivesTo(open(CASH_REGISTER), '/panel')
  })

  it('una cuenta sin ninguna pantalla termina en su perfil', async () => {
    server()
    signInAs([])
    await arrivesTo(open('/'), PROFILE)
    await arrivesTo(open('/inventario'), PROFILE)
  })

  it('una ruta que no existe lleva al inicio de la cuenta', async () => {
    server()
    signInAs(PERMISSIONS_WAITER)
    await arrivesTo(open('/no-existe/de-verdad'), '/pedidos')
  })
})

describe('guarda del área de plataforma', () => {
  it('una sesión de restaurante no entra: pide el acceso de plataforma', async () => {
    server()
    signInAs(PERMISSIONS_OWNER)
    await arrivesTo(open(LOG), '/plataforma/acceso')
  })

  it('con la sesión de plataforma abre la pantalla pedida', async () => {
    server().on('get', PLATFORM, { items: [], total: 0 }).on('get', '/platform/auth/me', ME_IN_PLATFORM)
    signInToPlatform()
    await arrivesTo(open(LOG), LOG)
  })

  it('una ruta desconocida del área vuelve a su inicio', async () => {
    server().on('get', PLATFORM, { items: [], total: 0 }).on('get', '/platform/auth/me', ME_IN_PLATFORM)
    signInToPlatform()
    await arrivesTo(open('/plataforma/cualquier-cosa'), '/plataforma')
  })
})
