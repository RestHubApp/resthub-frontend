import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { signInToPlatform, restaurantCard, mountPlatform } from '#jest/fixtures/plataforma'
import { ErrorResponse, server } from '#jest/harness'
import type { PlatformRestaurantDetail } from '@/api/types'

const LA_ESQUINA = 'La Esquina'
const AMERICA_BOGOTA = 'America/Bogota'
const MARTA_RIOS = 'Marta Ríos'
const MARTA_ESQUINA_PE = 'marta@esquina.pe'
const ADD_OWNER = 'Agregar encargado'
const SECRET_SAFE_1 = 'clave-segura-1'

const CARD = '/platform/restaurants/4'
const SAVE = { name: 'Guardar cambios' }

function openCard(initial: PlatformRestaurantDetail | ErrorResponse = restaurantCard()) {
  // Como el servidor: lo que se guarda es lo que devuelve la ficha al releerla.
  let actual = initial
  const save = (card: PlatformRestaurantDetail) => {
    actual = card
    return card
  }
  const api = server().on('get', CARD, () => (actual instanceof ErrorResponse ? actual : { ...actual }))
  signInToPlatform()
  return { api, guardar: save, ...mountPlatform('/plataforma/restaurantes/4') }
}

describe('RestaurantDetailView', () => {
  it('muestra el local, su estado y sus encargados', async () => {
    openCard()

    expect(await screen.findByRole('heading', { name: 'La Esquina de Lucho', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Personal: 3 de 4 activas')).toBeInTheDocument()
    expect(screen.getByText('Lucho Ramos')).toBeInTheDocument()
    expect(screen.getByText('Su personal puede entrar y trabajar con normalidad.')).toBeInTheDocument()
  })

  it('guarda solo el campo que se cambió y muestra lo que devolvió el servidor', async () => {
    const { api, guardar: save, user } = openCard()
    api.on('patch', CARD, () => save(restaurantCard({ name: LA_ESQUINA })))
    const name = await screen.findByLabelText('Nombre')
    expect(screen.getByRole('button', SAVE)).toBeDisabled()

    await user.clear(name)
    await user.type(name, '  La Esquina  ')
    await user.click(screen.getByRole('button', SAVE))

    expect(await screen.findByText('Cambios guardados.')).toBeInTheDocument()
    expect(api.llamadas('patch', CARD)[0]?.body).toEqual({ name: LA_ESQUINA })
    expect(screen.getByRole('heading', { name: LA_ESQUINA, level: 1 })).toBeInTheDocument()
  })

  it('cambiar la zona horaria manda solo la zona', async () => {
    const { api, guardar: save, user } = openCard()
    api.on('patch', CARD, () => save(restaurantCard({ timezone: AMERICA_BOGOTA })))

    await user.selectOptions(await screen.findByRole('combobox', { name: 'Zona horaria' }), AMERICA_BOGOTA)
    await user.click(screen.getByRole('button', SAVE))

    expect(await screen.findByText('Cambios guardados.')).toBeInTheDocument()
    expect(api.llamadas('patch', CARD)[0]?.body).toEqual({ timezone: AMERICA_BOGOTA })
  })

  it('desactivar se confirma explicando cuántas cuentas pierden el acceso', async () => {
    const { api, guardar: save, user } = openCard()
    api.on('patch', CARD, () => save(restaurantCard({ is_active: false })))

    await user.click(await screen.findByRole('button', { name: 'Desactivar restaurante' }))
    const notice = await screen.findByRole('alertdialog', { name: '¿Desactivar La Esquina de Lucho?' })
    expect(within(notice).getByText(/las 4 cuentas de su personal/u)).toBeInTheDocument()
    await user.click(within(notice).getByRole('button', { name: 'Desactivar' }))

    expect(await screen.findByText('Nadie de su personal puede entrar. Sus datos se conservan.')).toBeInTheDocument()
    expect(api.llamadas('patch', CARD)[0]?.body).toEqual({ is_active: false })
    expect(screen.getByRole('button', { name: 'Activar restaurante' })).toBeInTheDocument()
  })

  it('activar un local desactivado va directo', async () => {
    const { api, guardar: save, user } = openCard(restaurantCard({ is_active: false }))
    api.on('patch', CARD, () => save(restaurantCard()))

    await user.click(await screen.findByRole('button', { name: 'Activar restaurante' }))

    expect(await screen.findByRole('button', { name: 'Desactivar restaurante' })).toBeInTheDocument()
    expect(api.llamadas('patch', CARD)[0]?.body).toEqual({ is_active: true })
  })
})

describe('RestaurantDetailView: encargados y errores', () => {
  it('agrega otro encargado y lo suma a la lista', async () => {
    const { api, guardar: save, user } = openCard()
    const marta = { id: 31, full_name: MARTA_RIOS, email: MARTA_ESQUINA_PE, is_active: true }
    api.on('post', `${CARD}/owners`, () => {
      const card = restaurantCard()
      save({ ...card, owners: [...card.owners, marta] })
      return marta
    })

    await user.click(await screen.findByRole('button', { name: ADD_OWNER }))
    const window = await screen.findByRole('dialog', { name: ADD_OWNER })
    await user.type(within(window).getByLabelText('Nombre completo'), MARTA_RIOS)
    await user.type(within(window).getByLabelText('Correo'), MARTA_ESQUINA_PE)
    await user.type(within(window).getByLabelText('Contraseña inicial'), SECRET_SAFE_1)
    await user.click(within(window).getByRole('button', { name: ADD_OWNER }))

    expect(await screen.findByText(MARTA_RIOS)).toBeInTheDocument()
    expect(api.llamadas('post', `${CARD}/owners`)[0]?.body).toEqual({
      full_name: MARTA_RIOS,
      email: MARTA_ESQUINA_PE,
      password: SECRET_SAFE_1,
    })
    expect(screen.queryByRole('dialog', { name: ADD_OWNER })).not.toBeInTheDocument()
  })

  it('un correo ya usado lo rechaza el servidor dentro de la ventana', async () => {
    const { api, user } = openCard(restaurantCard({ owners: [] }))
    api.on('post', `${CARD}/owners`, new ErrorResponse(409, 'Ese correo ya tiene una cuenta.'))

    expect(await screen.findByText('Este restaurante no tiene encargados.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: ADD_OWNER }))
    const window = await screen.findByRole('dialog')
    await user.type(within(window).getByLabelText('Nombre completo'), MARTA_RIOS)
    await user.type(within(window).getByLabelText('Correo'), 'lucho@esquina.pe')
    await user.type(within(window).getByLabelText('Contraseña inicial'), SECRET_SAFE_1)
    await user.click(within(window).getByRole('button', { name: ADD_OWNER }))

    expect(await within(window).findByText('Ese correo ya tiene una cuenta.')).toBeInTheDocument()
  })

  it('un restaurante que no existe se muestra como «no existe»', async () => {
    openCard(new ErrorResponse(404, 'No existe'))

    expect(await screen.findByText('Este restaurante no existe.')).toBeInTheDocument()
  })

  it('un identificador inválido en la dirección no llega al servidor', async () => {
    const api = server()
    signInToPlatform()
    mountPlatform('/plataforma/restaurantes/abc')

    expect(await screen.findByText('Este restaurante no existe.')).toBeInTheDocument()
    expect(api.peticiones.filter((p) => p.url.startsWith('/platform/restaurants/'))).toHaveLength(0)
  })

  it('otro error se puede reintentar', async () => {
    openCard(new ErrorResponse(500, 'Servidor caído'))

    expect(await screen.findByText('Servidor caído')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })
})
