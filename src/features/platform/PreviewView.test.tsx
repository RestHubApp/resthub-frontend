import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { signInToPlatform, mountPlatform, logRecord, restaurantSummary } from '#jest/fixtures/platform'
import { ErrorResponse, server } from '#jest/harness'

const PLATFORM_ACTIVITY = '/platform/activity'

const SAMPLE = '/platform/sandbox'
const PREVIEW = '/platform/preview'
const VIEW_AS_WAITER = { name: 'Ver como mesero' }
const NO_WAITER = 'El local de muestra no tiene un mesero activo.'
const RESET = { name: 'Reiniciar local de muestra' }
const LOCAL = { restaurant: restaurantSummary({ id: 99, name: 'Muestra RestHub', slug: 'muestra' }), accounts: [
  { full_name: 'Encargada de muestra', kind: 'owner' as const, role_label: 'Encargado' },
  { full_name: 'Mesero de muestra', kind: 'waiter' as const, role_label: 'Mesero' },
] }

let openTab: jest.Spied<typeof window.open>

beforeEach(() => {
  openTab = jest.spyOn(window, 'open').mockReturnValue(null)
})

afterEach(() => {
  openTab.mockRestore()
})

function openPreview(sample: unknown = LOCAL) {
  const api = server().on('get', SAMPLE, sample)
  signInToPlatform()
  return { api, ...mountPlatform('/plataforma/vista-previa') }
}

describe('PreviewView', () => {
  it('muestra el local de muestra y sus cuentas', async () => {
    openPreview()

    expect(await screen.findByText('Encargada de muestra')).toBeInTheDocument()
    expect(screen.getByText('muestra', { selector: 'code' })).toBeInTheDocument()
    expect(screen.getByText('Mesero de muestra')).toBeInTheDocument()
  })

  it('sin local de muestra explica que se crea con la primera vista previa', async () => {
    openPreview({ restaurant: null, accounts: [] })

    expect(await screen.findByText('Todavía no hay local de muestra.')).toBeInTheDocument()
  })

  it('«Ver como mesero» pide un código y abre la pestaña sin opener, con enlace de repuesto', async () => {
    const { api, user } = openPreview()
    api.on('post', PREVIEW, { code: 'abc 123', expires_in: 60 })

    await user.click(await screen.findByRole('button', VIEW_AS_WAITER))

    expect(await screen.findByText('Se abrió la vista previa como mesero en otra pestaña.')).toBeInTheDocument()
    expect(api.calls('post', PREVIEW)[0]?.body).toEqual({ as: 'waiter' })
    expect(openTab).toHaveBeenCalledWith('/vista-previa#codigo=abc%20123', '_blank', 'noopener')
    const link = screen.getByRole('link', { name: 'Abrir la vista previa como mesero' })
    expect(link).toHaveAttribute('href', '/vista-previa#codigo=abc%20123')
    await user.click(link)
    expect(screen.queryByRole('link', { name: 'Abrir la vista previa como mesero' })).not.toBeInTheDocument()
  })

  it('si al local le falta esa cuenta (409), ofrece reiniciarlo', async () => {
    const { api, user } = openPreview()
    api.on('post', PREVIEW, new ErrorResponse(409, NO_WAITER, 'sandbox_account_unavailable'))

    await user.click(await screen.findByRole('button', VIEW_AS_WAITER))

    expect(await screen.findByText(NO_WAITER)).toBeInTheDocument()
    expect(screen.getAllByRole('button', RESET)).toHaveLength(2)
    expect(openTab).not.toHaveBeenCalled()
  })

  it('un 409 con otro código no ofrece reiniciar: decide el código, no el estado ni el texto', async () => {
    const { api, user } = openPreview()
    api.on('post', PREVIEW, new ErrorResponse(409, NO_WAITER, 'sandbox_already_active'))

    await user.click(await screen.findByRole('button', VIEW_AS_WAITER))

    expect(await screen.findByText(NO_WAITER)).toBeInTheDocument()
    expect(screen.getAllByRole('button', RESET)).toHaveLength(1)
  })

  it('reiniciar se confirma, archiva el local y muestra el nuevo', async () => {
    const { api, user } = openPreview()
    const fresh = { ...LOCAL, restaurant: { ...LOCAL.restaurant, name: 'Muestra RestHub 2' } }
    api.on('post', `${SAMPLE}/reset`, fresh)

    await user.click(await screen.findByRole('button', RESET))
    const notice = await screen.findByRole('alertdialog', { name: '¿Reiniciar el local de muestra?' })
    expect(within(notice).getByText(/se archivan/u)).toBeInTheDocument()
    await user.click(within(notice).getByRole('button', { name: 'Reiniciar' }))

    expect(await screen.findByText('Listo: el local de muestra empieza de nuevo.')).toBeInTheDocument()
    expect(screen.getByText('Muestra RestHub 2')).toBeInTheDocument()
    expect(api.calls('post', `${SAMPLE}/reset`)).toHaveLength(1)
  })

  it('si no se puede leer el local de muestra, deja reintentar', async () => {
    openPreview(new ErrorResponse(500, 'Servidor caído'))

    expect(await screen.findByText('Servidor caído')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })
})

describe('ActivityView', () => {
  it('lista lo que hizo cada administrador, en horas de Lima', async () => {
    server().on('get', PLATFORM_ACTIVITY, { items: [logRecord()], total: 1 })
    signInToPlatform()
    mountPlatform('/plataforma/bitacora')

    const row = await screen.findByRole('row', { name: /Alta de restaurante/u })
    expect(within(row).getByText('Equipo RestHub')).toBeInTheDocument()
    expect(within(row).getByText('La Esquina de Lucho')).toBeInTheDocument()
    expect(screen.getByText('1 en total')).toBeInTheDocument()
  })

  it('sin registros lo dice y un error se puede reintentar', async () => {
    const api = server().on('get', PLATFORM_ACTIVITY, new ErrorResponse(500, 'Bitácora caída'))
    signInToPlatform()
    const { user } = mountPlatform('/plataforma/bitacora')

    expect(await screen.findByText('Bitácora caída')).toBeInTheDocument()
    api.on('get', PLATFORM_ACTIVITY, { items: [], total: 0 })
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('Todavía no hay nada registrado.')).toBeInTheDocument()
  })
})
