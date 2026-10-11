import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { buildAccount, signInAs, mountScreen, mountRoutes, TEST_SCREENS, PERMISSIONS_OWNER, ErrorResponse, server } from '#jest/harness'
import { useSession } from '@/store/session'
import { AppShell } from './AppShell'
import { ComingSoonView } from './ComingSoonView'
import { HomeRedirect } from './HomeRedirect'
import { PreviewEndedView } from './PreviewEndedView'
import { RequireSession } from './RequireSession'
import { ShellScreensContext } from './shellScreens'

const ROUTE = { name: 'Ruta actual' }

// Un token con `exp` legible: la franja de vista previa cuenta el tiempo que le queda.
function tokenThatExpiresIn(seconds: number): string {
  const load = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + seconds }))
  return `cabecera.${load}.firma`
}

describe('HomeRedirect', () => {
  it('sin sesión lleva al acceso', async () => {
    server()
    mountScreen(<ShellScreensContext value={TEST_SCREENS}><HomeRedirect /></ShellScreensContext>)

    expect(await screen.findByRole('status', ROUTE)).toHaveTextContent('/acceso')
  })

  it('lleva a la primera pantalla que la cuenta puede abrir', async () => {
    server()
    signInAs(['insights.read'])
    mountScreen(<ShellScreensContext value={TEST_SCREENS}><HomeRedirect /></ShellScreensContext>)

    expect(await screen.findByRole('status', ROUTE)).toHaveTextContent('/panel')
  })

  it('una cuenta sin pantallas va a su perfil', async () => {
    server()
    signInAs([])
    mountScreen(<ShellScreensContext value={TEST_SCREENS}><HomeRedirect /></ShellScreensContext>)

    expect(await screen.findByRole('status', ROUTE)).toHaveTextContent('/perfil')
  })
})

describe('RequireSession', () => {
  function openProtected() {
    const routes = [{ element: <RequireSession permission="cash.manage" />, children: [{ path: '/caja', element: <p>Caja privada</p> }] }]
    return mountRoutes(routes, '/caja')
  }

  it('deja pasar a quien tiene el permiso', () => {
    server()
    signInAs(['cash.manage'])
    openProtected()

    expect(screen.getByText('Caja privada')).toBeInTheDocument()
  })

  it('sin el permiso vuelve al inicio sin mostrar la pantalla', async () => {
    server()
    signInAs(['orders.take'])
    openProtected()

    expect(await screen.findByRole('status', ROUTE)).toHaveTextContent(/^\/$/u)
    expect(screen.queryByText('Caja privada')).not.toBeInTheDocument()
  })

  it('sin sesión va al acceso recordando adónde se quería ir', async () => {
    server()
    const { router } = openProtected()

    expect(await screen.findByRole('status', ROUTE)).toHaveTextContent('/acceso')
    expect(router.state.location.state).toEqual({ from: '/caja' })
  })
})

describe('ComingSoonView', () => {
  it('toma el título y la descripción de la entrada del menú', () => {
    mountScreen(<ShellScreensContext value={TEST_SCREENS}><ComingSoonView /></ShellScreensContext>, { path: '/reservas' })

    expect(screen.getByRole('heading', { name: 'Reservas', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Las reservas de cada día: a qué hora, cuántos y en qué mesa.')).toBeInTheDocument()
  })

  it('en una ruta sin entrada dice «Próximamente»', () => {
    mountScreen(<ComingSoonView />, { path: '/otra' })

    expect(screen.getByRole('heading', { name: 'Próximamente', level: 1 })).toBeInTheDocument()
  })
})

describe('PreviewEndedView', () => {
  it('si venció lo explica y ofrece cerrar la pestaña', () => {
    useSession.setState({ expired: true })
    mountScreen(<PreviewEndedView />)

    expect(screen.getByText('La vista previa venció')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cerrar la vista previa' })).toBeInTheDocument()
  })

  it('si se salió, dice que la pestaña ya no tiene sesión', () => {
    mountScreen(<PreviewEndedView />)

    expect(screen.getByText('Saliste de la vista previa')).toBeInTheDocument()
  })
})

describe('franja de la vista previa', () => {
  function openPreview(seconds: number) {
    server()
    signInAs(PERMISSIONS_OWNER, { preview: true })
    useSession.setState({ token: tokenThatExpiresIn(seconds) })
    return mountRoutes([{ path: '/', element: <AppShell screens={TEST_SCREENS} />, children: [{ index: true, element: <p>Inicio</p> }] }])
  }

  it('dice qué local se mira, como quién y cuánto falta, sin «Cerrar sesión»', () => {
    openPreview(20 * 60)

    const slot = screen.getByRole('region', { name: 'Vista previa' })
    expect(within(slot).getByText('Vista previa · La Picantería · como Encargado')).toBeInTheDocument()
    expect(within(slot).getByRole('timer')).toHaveTextContent(/^Vence en/u)
    expect(within(slot).getByRole('button', { name: 'Salir de la vista previa' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cerrar sesión' })).not.toBeInTheDocument()
  })

  it('resalta el tiempo cuando faltan cinco minutos o menos', () => {
    openPreview(60)

    expect(screen.getByRole('timer')).toHaveClass('bg-white')
  })
})

describe('RequireSession: términos y privacidad', () => {
  const TERMS = '/auth/me/terms'

  function openProtected() {
    const routes = [{ element: <RequireSession />, children: [{ path: '/pedidos', element: <p>Pedidos</p> }] }]
    return mountRoutes(routes, '/pedidos')
  }

  it('sin aceptar los términos vigentes no se trabaja, y al aceptarlos se entra', async () => {
    const api = server()
    const accepted = buildAccount(PERMISSIONS_OWNER, { terms_accepted: true })
    api.on('post', TERMS, accepted)
    signInAs(PERMISSIONS_OWNER, { terms_accepted: false })
    const { user } = openProtected()

    expect(screen.getByRole('heading', { name: 'Antes de empezar' })).toBeInTheDocument()
    expect(screen.queryByText('Pedidos')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /términos de uso y la política de privacidad/u })).toHaveAttribute('href', '/privacidad')
    await user.click(screen.getByRole('button', { name: 'Acepto los términos' }))

    expect(await screen.findByText('Pedidos')).toBeInTheDocument()
    expect(api.calls('post', TERMS)[0]?.body).toEqual({ version: '2026-10' })
  })

  it('si la versión cambió mientras se leía, la relee y la vuelve a pedir', async () => {
    const api = server()
    api.on('post', TERMS, new ErrorResponse(409, 'Los términos cambiaron.', 'outdated_terms'))
    api.on('get', '/auth/me', buildAccount(PERMISSIONS_OWNER, { terms_accepted: false, terms_version: '2027-01' }))
    signInAs(PERMISSIONS_OWNER, { terms_accepted: false })
    const { user } = openProtected()

    await user.click(screen.getByRole('button', { name: 'Acepto los términos' }))

    expect(await screen.findByRole('link', { name: /versión 2027-01/u })).toBeInTheDocument()
  })

  it('una vista previa no los pide: quien mira no es el dueño de la cuenta', () => {
    server()
    signInAs(PERMISSIONS_OWNER, { terms_accepted: false, preview: true })
    openProtected()

    expect(screen.getByText('Pedidos')).toBeInTheDocument()
  })
})
