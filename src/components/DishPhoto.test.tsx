import { beforeEach, describe, expect, it } from '@jest/globals'
import { screen, waitFor } from '@testing-library/react'

import { mountScreen, server, signInAs } from '#jest/harness'
import { DishPhoto } from './DishPhoto'

const PHOTO = '/menu/items/10/photo'
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const IMAGE = 'dish-photo'
const LOADING = 'dish-photo-loading'

function imageResponse(): Response {
  return new Response(PNG, { status: 200, headers: { 'Content-Type': 'image/png' } })
}

describe('DishPhoto', () => {
  beforeEach(() => {
    signInAs()
  })

  it('muestra la foto del plato pedida con su versión', async () => {
    const api = server().on('get', PHOTO, imageResponse)

    mountScreen(<DishPhoto itemId={10} version={1700} isVisible />)

    const image = await screen.findByTestId(IMAGE)
    expect(image).toHaveAttribute('src', expect.stringMatching(/^data:image\/png;base64,/u))
    expect(image).toHaveAttribute('alt', '')
    expect(api.calls('get', PHOTO)[0]?.params).toEqual({ v: '1700' })
  })

  it('mientras llega deja un recuadro del mismo tamaño', async () => {
    server().on('get', PHOTO, imageResponse)

    mountScreen(<DishPhoto itemId={10} version={1700} isVisible />)

    expect(screen.getByTestId(LOADING)).toBeInTheDocument()
    expect(await screen.findByTestId(IMAGE)).toBeInTheDocument()
  })

  it('sin foto no pide nada ni ocupa lugar', () => {
    const api = server().on('get', PHOTO, imageResponse)

    mountScreen(<DishPhoto itemId={10} version={null} isVisible />)

    expect(screen.queryByTestId(IMAGE)).not.toBeInTheDocument()
    expect(screen.queryByTestId(LOADING)).not.toBeInTheDocument()
    expect(api.calls('get', PHOTO)).toHaveLength(0)
  })

  it('con las fotos ocultas no pide ni muestra nada', () => {
    const api = server().on('get', PHOTO, imageResponse)

    mountScreen(<DishPhoto itemId={10} version={1700} isVisible={false} />)

    expect(screen.queryByTestId(IMAGE)).not.toBeInTheDocument()
    expect(api.calls('get', PHOTO)).toHaveLength(0)
  })

  it('si la imagen no llega, no deja un recuadro roto', async () => {
    const api = server()

    mountScreen(<DishPhoto itemId={10} version={1700} isVisible />)

    await waitFor(() => {
      expect(api.calls('get', PHOTO)).toHaveLength(1)
    })
    await waitFor(() => {
      expect(screen.queryByTestId(LOADING)).not.toBeInTheDocument()
    })
    expect(screen.queryByTestId(IMAGE)).not.toBeInTheDocument()
  })
})
