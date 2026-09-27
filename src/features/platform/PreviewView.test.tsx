import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { entrarAPlataforma, montarPlataforma, registroDeBitacora, resumenDeRestaurante } from '#jest/fixtures/plataforma'
import { RespuestaDeError, servidor } from '#jest/harness'

const PLATFORM_ACTIVITY = '/platform/activity'

const MUESTRA = '/platform/sandbox'
const PREVIA = '/platform/preview'
const REINICIAR = { name: 'Reiniciar local de muestra' }
const LOCAL = { restaurant: resumenDeRestaurante({ id: 99, name: 'Muestra RestHub', slug: 'muestra' }), accounts: [
  { full_name: 'Encargada de muestra', kind: 'owner' as const, role_label: 'Encargado' },
  { full_name: 'Mesero de muestra', kind: 'waiter' as const, role_label: 'Mesero' },
] }

let abrirPestana: jest.Spied<typeof window.open>

beforeEach(() => {
  abrirPestana = jest.spyOn(window, 'open').mockReturnValue(null)
})

afterEach(() => {
  abrirPestana.mockRestore()
})

function abrirVistaPrevia(muestra: unknown = LOCAL) {
  const api = servidor().on('get', MUESTRA, muestra)
  entrarAPlataforma()
  return { api, ...montarPlataforma('/plataforma/vista-previa') }
}

describe('PreviewView', () => {
  it('muestra el local de muestra y sus cuentas', async () => {
    abrirVistaPrevia()

    expect(await screen.findByText('Encargada de muestra')).toBeInTheDocument()
    expect(screen.getByText('muestra', { selector: 'code' })).toBeInTheDocument()
    expect(screen.getByText('Mesero de muestra')).toBeInTheDocument()
  })

  it('sin local de muestra explica que se crea con la primera vista previa', async () => {
    abrirVistaPrevia({ restaurant: null, accounts: [] })

    expect(await screen.findByText('Todavía no hay local de muestra.')).toBeInTheDocument()
  })

  it('«Ver como mesero» pide un código y abre la pestaña sin opener, con enlace de repuesto', async () => {
    const { api, user } = abrirVistaPrevia()
    api.on('post', PREVIA, { code: 'abc 123', expires_in: 60 })

    await user.click(await screen.findByRole('button', { name: 'Ver como mesero' }))

    expect(await screen.findByText('Se abrió la vista previa como mesero en otra pestaña.')).toBeInTheDocument()
    expect(api.llamadas('post', PREVIA)[0]?.body).toEqual({ as: 'waiter' })
    expect(abrirPestana).toHaveBeenCalledWith('/vista-previa#codigo=abc%20123', '_blank', 'noopener')
    const enlace = screen.getByRole('link', { name: 'Abrir la vista previa como mesero' })
    expect(enlace).toHaveAttribute('href', '/vista-previa#codigo=abc%20123')
    await user.click(enlace)
    expect(screen.queryByRole('link', { name: 'Abrir la vista previa como mesero' })).not.toBeInTheDocument()
  })

  it('si al local le falta esa cuenta (409), ofrece reiniciarlo', async () => {
    const { api, user } = abrirVistaPrevia()
    api.on('post', PREVIA, new RespuestaDeError(409, 'El local de muestra no tiene un mesero activo.'))

    await user.click(await screen.findByRole('button', { name: 'Ver como mesero' }))

    expect(await screen.findByText('El local de muestra no tiene un mesero activo.')).toBeInTheDocument()
    expect(screen.getAllByRole('button', REINICIAR)).toHaveLength(2)
    expect(abrirPestana).not.toHaveBeenCalled()
  })

  it('reiniciar se confirma, archiva el local y muestra el nuevo', async () => {
    const { api, user } = abrirVistaPrevia()
    const nuevo = { ...LOCAL, restaurant: { ...LOCAL.restaurant, name: 'Muestra RestHub 2' } }
    api.on('post', `${MUESTRA}/reset`, nuevo)

    await user.click(await screen.findByRole('button', REINICIAR))
    const aviso = await screen.findByRole('alertdialog', { name: '¿Reiniciar el local de muestra?' })
    expect(within(aviso).getByText(/se archivan/u)).toBeInTheDocument()
    await user.click(within(aviso).getByRole('button', { name: 'Reiniciar' }))

    expect(await screen.findByText('Listo: el local de muestra empieza de nuevo.')).toBeInTheDocument()
    expect(screen.getByText('Muestra RestHub 2')).toBeInTheDocument()
    expect(api.llamadas('post', `${MUESTRA}/reset`)).toHaveLength(1)
  })

  it('si no se puede leer el local de muestra, deja reintentar', async () => {
    abrirVistaPrevia(new RespuestaDeError(500, 'Servidor caído'))

    expect(await screen.findByText('Servidor caído')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })
})

describe('ActivityView', () => {
  it('lista lo que hizo cada administrador, en horas de Lima', async () => {
    servidor().on('get', PLATFORM_ACTIVITY, { items: [registroDeBitacora()], total: 1 })
    entrarAPlataforma()
    montarPlataforma('/plataforma/bitacora')

    const fila = await screen.findByRole('row', { name: /Alta de restaurante/u })
    expect(within(fila).getByText('Equipo RestHub')).toBeInTheDocument()
    expect(within(fila).getByText('La Esquina de Lucho')).toBeInTheDocument()
    expect(screen.getByText('1 en total')).toBeInTheDocument()
  })

  it('sin registros lo dice y un error se puede reintentar', async () => {
    const api = servidor().on('get', PLATFORM_ACTIVITY, new RespuestaDeError(500, 'Bitácora caída'))
    entrarAPlataforma()
    const { user } = montarPlataforma('/plataforma/bitacora')

    expect(await screen.findByText('Bitácora caída')).toBeInTheDocument()
    api.on('get', PLATFORM_ACTIVITY, { items: [], total: 0 })
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('Todavía no hay nada registrado.')).toBeInTheDocument()
  })
})
