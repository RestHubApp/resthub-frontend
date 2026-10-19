import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { act, screen, waitFor, within } from '@testing-library/react'

import { buildMenu, dish } from '#jest/fixtures/inventory'
import { ErrorResponse, mountScreen, PERMISSIONS_OWNER, server, signInAs } from '#jest/harness'
import type { MenuResponse } from '@/api/types'
import { useAppearance } from '@/store/appearance'
import { MenuView } from './MenuView'

const MENU = '/menu'
const COSTS = '/inventory/recipes'
const PHOTO = '/menu/items/10/photo'
const PNG_TYPE = 'image/png'
const PNG_FILE = 'ceviche.png'
const IMAGE = 'dish-photo'
const PICKER = 'Elegir la foto de Ceviche'
const REMOVE = { name: 'Quitar foto' }
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

function menuWith(photoVersion: number | null): MenuResponse {
  const menu = buildMenu()
  const first = menu.categories[0]
  if (first === undefined) {
    throw new Error('La carta de prueba no tiene categorías')
  }
  menu.categories[0] = { ...first, items: [dish({ photo_version: photoVersion }), ...first.items.slice(1)] }
  return menu
}

function imageResponse(): Response {
  return new Response(PNG, { status: 200, headers: { 'Content-Type': PNG_TYPE } })
}

/** El celular entrega una foto grande; el navegador de la prueba la reduce con un lienzo simulado. */
function stubBrowserImaging(): void {
  Object.assign(globalThis, {
    createImageBitmap: jest.fn(() => Promise.resolve({ width: 2000, height: 1500, close: jest.fn() })),
  })
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: jest.fn(), fillRect: jest.fn() } as unknown as CanvasRenderingContext2D)
  jest.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback, type) => {
    callback(new Blob([PNG], { type: type ?? 'image/webp' }))
  })
}

async function openRecord(user: ReturnType<typeof mountScreen>['user']) {
  await user.click(await screen.findByRole('button', { name: 'Ver la ficha de Ceviche' }))
  return screen.findByRole('dialog', { name: 'Ceviche' })
}

describe('DishPhotoField: la foto en la ficha del plato', () => {
  beforeEach(() => {
    stubBrowserImaging()
    signInAs(PERMISSIONS_OWNER)
  })

  afterEach(() => {
    jest.restoreAllMocks()
    useAppearance.getState().reset()
  })

  it('un plato sin foto lo dice y ofrece subirla', async () => {
    server().on('get', MENU, menuWith(null)).on('get', COSTS, [])
    const { user } = mountScreen(<MenuView />)

    const record = await openRecord(user)

    expect(within(record).getByText('Este plato no tiene foto.')).toBeInTheDocument()
    expect(within(record).getByRole('button', { name: 'Subir foto' })).toBeEnabled()
    expect(within(record).queryByRole('button', REMOVE)).not.toBeInTheDocument()
  })

  it('al elegir una imagen la reduce, la envía en base64 y deja la versión nueva en la carta', async () => {
    const api = server().on('get', MENU, menuWith(null)).on('get', COSTS, [])
    api.on('put', PHOTO, () => {
      api.on('get', MENU, menuWith(1700))
      return dish({ photo_version: 1700 })
    })
    api.on('get', PHOTO, imageResponse)
    const { user } = mountScreen(<MenuView />)
    const record = await openRecord(user)

    await user.upload(within(record).getByLabelText(PICKER), new File([PNG], PNG_FILE, { type: PNG_TYPE }))

    expect(await screen.findByText('Foto guardada.')).toBeInTheDocument()
    expect(api.calls('put', PHOTO)[0]?.body).toEqual({ data: expect.stringMatching(/^[A-Za-z0-9+/]+=*$/u) })
    expect(await within(record).findByRole('button', { name: 'Cambiar foto' })).toBeInTheDocument()
    expect(within(record).getByRole('button', REMOVE)).toBeInTheDocument()
  })

  it('un archivo vacío no se envía y el aviso lo explica', async () => {
    const api = server().on('get', MENU, menuWith(null)).on('get', COSTS, [])
    const { user } = mountScreen(<MenuView />)
    const record = await openRecord(user)

    await user.upload(within(record).getByLabelText(PICKER), new File([], 'vacia.png', { type: PNG_TYPE }))

    expect(await screen.findByText(/No se pudo guardar la foto/u)).toBeInTheDocument()
    expect(api.calls('put', PHOTO)).toHaveLength(0)
  })

  it('si el servidor la rechaza, avisa con su explicación', async () => {
    const api = server().on('get', MENU, menuWith(null)).on('get', COSTS, [])
    api.on('put', PHOTO, new ErrorResponse(422, 'La foto no puede pasar de 400 KB.'))
    const { user } = mountScreen(<MenuView />)
    const record = await openRecord(user)

    await user.upload(within(record).getByLabelText(PICKER), new File([PNG], PNG_FILE, { type: PNG_TYPE }))

    expect(await screen.findByText('La foto no puede pasar de 400 KB.')).toBeInTheDocument()
  })

  it('quitar la foto la borra en el servidor y vuelve a «sin foto»', async () => {
    const api = server().on('get', MENU, menuWith(1700)).on('get', COSTS, []).on('get', PHOTO, imageResponse)
    api.on('delete', PHOTO, () => {
      api.on('get', MENU, menuWith(null))
      return dish({ photo_version: null })
    })
    const { user } = mountScreen(<MenuView />)
    const record = await openRecord(user)

    await user.click(within(record).getByRole('button', REMOVE))

    expect(await screen.findByText('Foto quitada.')).toBeInTheDocument()
    await waitFor(() => {
      expect(within(record).getByText('Este plato no tiene foto.')).toBeInTheDocument()
    })
    expect(api.calls('delete', PHOTO)).toHaveLength(1)
  })

  it('en la carta la miniatura se ve y desaparece al ocultar las fotos en Apariencia', async () => {
    server().on('get', MENU, menuWith(1700)).on('get', COSTS, []).on('get', PHOTO, imageResponse)
    mountScreen(<MenuView />)

    expect(await screen.findByTestId(IMAGE)).toBeInTheDocument()
    act(() => {
      useAppearance.getState().change({ showDishPhotos: false })
    })

    await waitFor(() => {
      expect(screen.queryByTestId(IMAGE)).not.toBeInTheDocument()
    })
  })
})
