import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { cuenta, entrarComo, montar, montarRutas, PERMISOS_ENCARGADO, RespuestaDeError, servidor } from '#jest/harness'
import { useSession } from '../../store/session'
import AppShell from './AppShell'
import ComingSoonView from './ComingSoonView'
import HomeRedirect from './HomeRedirect'
import PreviewEndedView from './PreviewEndedView'
import RequireSession from './RequireSession'

const RUTA = { name: 'Ruta actual' }

// Un token con `exp` legible: la franja de vista previa cuenta el tiempo que le queda.
function tokenQueVenceEn(segundos: number): string {
  const carga = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + segundos }))
  return `cabecera.${carga}.firma`
}

describe('HomeRedirect', () => {
  it('sin sesión lleva al acceso', async () => {
    servidor()
    montar(<HomeRedirect />)

    expect(await screen.findByRole('status', RUTA)).toHaveTextContent('/acceso')
  })

  it('lleva a la primera pantalla que la cuenta puede abrir', async () => {
    servidor()
    entrarComo(['insights.read'])
    montar(<HomeRedirect />)

    expect(await screen.findByRole('status', RUTA)).toHaveTextContent('/panel')
  })

  it('una cuenta sin pantallas va a su perfil', async () => {
    servidor()
    entrarComo([])
    montar(<HomeRedirect />)

    expect(await screen.findByRole('status', RUTA)).toHaveTextContent('/perfil')
  })
})

describe('RequireSession', () => {
  function abrirProtegida() {
    const rutas = [{ element: <RequireSession permission="cash.manage" />, children: [{ path: '/caja', element: <p>Caja privada</p> }] }]
    return montarRutas(rutas, '/caja')
  }

  it('deja pasar a quien tiene el permiso', () => {
    servidor()
    entrarComo(['cash.manage'])
    abrirProtegida()

    expect(screen.getByText('Caja privada')).toBeInTheDocument()
  })

  it('sin el permiso vuelve al inicio sin mostrar la pantalla', async () => {
    servidor()
    entrarComo(['orders.take'])
    abrirProtegida()

    expect(await screen.findByRole('status', RUTA)).toHaveTextContent(/^\/$/u)
    expect(screen.queryByText('Caja privada')).not.toBeInTheDocument()
  })

  it('sin sesión va al acceso recordando adónde se quería ir', async () => {
    servidor()
    const { router } = abrirProtegida()

    expect(await screen.findByRole('status', RUTA)).toHaveTextContent('/acceso')
    expect(router.state.location.state).toEqual({ from: '/caja' })
  })
})

describe('ComingSoonView', () => {
  it('toma el título y la descripción de la entrada del menú', () => {
    montar(<ComingSoonView />, { path: '/reservas' })

    expect(screen.getByRole('heading', { name: 'Reservas', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Las reservas de cada día: a qué hora, cuántos y en qué mesa.')).toBeInTheDocument()
  })

  it('en una ruta sin entrada dice «Próximamente»', () => {
    montar(<ComingSoonView />, { path: '/otra' })

    expect(screen.getByRole('heading', { name: 'Próximamente', level: 1 })).toBeInTheDocument()
  })
})

describe('PreviewEndedView', () => {
  it('si venció lo explica y ofrece cerrar la pestaña', () => {
    useSession.setState({ expired: true })
    montar(<PreviewEndedView />)

    expect(screen.getByText('La vista previa venció')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cerrar la vista previa' })).toBeInTheDocument()
  })

  it('si se salió, dice que la pestaña ya no tiene sesión', () => {
    montar(<PreviewEndedView />)

    expect(screen.getByText('Saliste de la vista previa')).toBeInTheDocument()
  })
})

describe('franja de la vista previa', () => {
  function abrirVistaPrevia(segundos: number) {
    servidor()
    entrarComo(PERMISOS_ENCARGADO, { preview: true })
    useSession.setState({ token: tokenQueVenceEn(segundos) })
    return montarRutas([{ path: '/', element: <AppShell />, children: [{ index: true, element: <p>Inicio</p> }] }])
  }

  it('dice qué local se mira, como quién y cuánto falta, sin «Cerrar sesión»', () => {
    abrirVistaPrevia(20 * 60)

    const franja = screen.getByRole('region', { name: 'Vista previa' })
    expect(within(franja).getByText('Vista previa · La Picantería · como Encargado')).toBeInTheDocument()
    expect(within(franja).getByRole('timer')).toHaveTextContent(/^Vence en/u)
    expect(within(franja).getByRole('button', { name: 'Salir de la vista previa' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cerrar sesión' })).not.toBeInTheDocument()
  })

  it('resalta el tiempo cuando faltan cinco minutos o menos', () => {
    abrirVistaPrevia(60)

    expect(screen.getByRole('timer')).toHaveClass('bg-white')
  })
})

describe('RequireSession: términos y privacidad', () => {
  const TERMINOS = '/auth/me/terms'

  function abrirProtegida() {
    const rutas = [{ element: <RequireSession />, children: [{ path: '/pedidos', element: <p>Pedidos</p> }] }]
    return montarRutas(rutas, '/pedidos')
  }

  it('sin aceptar los términos vigentes no se trabaja, y al aceptarlos se entra', async () => {
    const api = servidor()
    const aceptada = cuenta(PERMISOS_ENCARGADO, { terms_accepted: true })
    api.on('post', TERMINOS, aceptada)
    entrarComo(PERMISOS_ENCARGADO, { terms_accepted: false })
    const { user } = abrirProtegida()

    expect(screen.getByRole('heading', { name: 'Antes de empezar' })).toBeInTheDocument()
    expect(screen.queryByText('Pedidos')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /términos de uso y la política de privacidad/u })).toHaveAttribute('href', '/privacidad')
    await user.click(screen.getByRole('button', { name: 'Acepto los términos' }))

    expect(await screen.findByText('Pedidos')).toBeInTheDocument()
    expect(api.llamadas('post', TERMINOS)[0]?.body).toEqual({ version: '2026-10' })
  })

  it('si la versión cambió mientras se leía, la relee y la vuelve a pedir', async () => {
    const api = servidor()
    api.on('post', TERMINOS, new RespuestaDeError(409, 'Los términos cambiaron.'))
    api.on('get', '/auth/me', cuenta(PERMISOS_ENCARGADO, { terms_accepted: false, terms_version: '2027-01' }))
    entrarComo(PERMISOS_ENCARGADO, { terms_accepted: false })
    const { user } = abrirProtegida()

    await user.click(screen.getByRole('button', { name: 'Acepto los términos' }))

    expect(await screen.findByRole('link', { name: /versión 2027-01/u })).toBeInTheDocument()
  })

  it('una vista previa no los pide: quien mira no es el dueño de la cuenta', () => {
    servidor()
    entrarComo(PERMISOS_ENCARGADO, { terms_accepted: false, preview: true })
    abrirProtegida()

    expect(screen.getByText('Pedidos')).toBeInTheDocument()
  })
})
