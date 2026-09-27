import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { entrarAPlataforma, fichaDeRestaurante, montarPlataforma } from '#jest/fixtures/plataforma'
import { RespuestaDeError, servidor } from '#jest/harness'
import type { PlatformRestaurantDetail } from '../../api/types'

const LA_ESQUINA = 'La Esquina'
const AMERICA_BOGOTA = 'America/Bogota'
const MARTA_RIOS = 'Marta Ríos'
const MARTA_ESQUINA_PE = 'marta@esquina.pe'
const AGREGAR_ENCARGADO = 'Agregar encargado'
const CLAVE_SEGURA_1 = 'clave-segura-1'

const FICHA = '/platform/restaurants/4'
const GUARDAR = { name: 'Guardar cambios' }

function abrirFicha(inicial: PlatformRestaurantDetail | RespuestaDeError = fichaDeRestaurante()) {
  // Como el servidor: lo que se guarda es lo que devuelve la ficha al releerla.
  let actual = inicial
  const guardar = (ficha: PlatformRestaurantDetail) => {
    actual = ficha
    return ficha
  }
  const api = servidor().on('get', FICHA, () => (actual instanceof RespuestaDeError ? actual : { ...actual }))
  entrarAPlataforma()
  return { api, guardar, ...montarPlataforma('/plataforma/restaurantes/4') }
}

describe('RestaurantDetailView', () => {
  it('muestra el local, su estado y sus encargados', async () => {
    abrirFicha()

    expect(await screen.findByRole('heading', { name: 'La Esquina de Lucho', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Personal: 3 de 4 activas')).toBeInTheDocument()
    expect(screen.getByText('Lucho Ramos')).toBeInTheDocument()
    expect(screen.getByText('Su personal puede entrar y trabajar con normalidad.')).toBeInTheDocument()
  })

  it('guarda solo el campo que se cambió y muestra lo que devolvió el servidor', async () => {
    const { api, guardar, user } = abrirFicha()
    api.on('patch', FICHA, () => guardar(fichaDeRestaurante({ name: LA_ESQUINA })))
    const nombre = await screen.findByLabelText('Nombre')
    expect(screen.getByRole('button', GUARDAR)).toBeDisabled()

    await user.clear(nombre)
    await user.type(nombre, '  La Esquina  ')
    await user.click(screen.getByRole('button', GUARDAR))

    expect(await screen.findByText('Cambios guardados.')).toBeInTheDocument()
    expect(api.llamadas('patch', FICHA)[0]?.body).toEqual({ name: LA_ESQUINA })
    expect(screen.getByRole('heading', { name: LA_ESQUINA, level: 1 })).toBeInTheDocument()
  })

  it('cambiar la zona horaria manda solo la zona', async () => {
    const { api, guardar, user } = abrirFicha()
    api.on('patch', FICHA, () => guardar(fichaDeRestaurante({ timezone: AMERICA_BOGOTA })))

    await user.selectOptions(await screen.findByRole('combobox', { name: 'Zona horaria' }), AMERICA_BOGOTA)
    await user.click(screen.getByRole('button', GUARDAR))

    expect(await screen.findByText('Cambios guardados.')).toBeInTheDocument()
    expect(api.llamadas('patch', FICHA)[0]?.body).toEqual({ timezone: AMERICA_BOGOTA })
  })

  it('desactivar se confirma explicando cuántas cuentas pierden el acceso', async () => {
    const { api, guardar, user } = abrirFicha()
    api.on('patch', FICHA, () => guardar(fichaDeRestaurante({ is_active: false })))

    await user.click(await screen.findByRole('button', { name: 'Desactivar restaurante' }))
    const aviso = await screen.findByRole('alertdialog', { name: '¿Desactivar La Esquina de Lucho?' })
    expect(within(aviso).getByText(/las 4 cuentas de su personal/u)).toBeInTheDocument()
    await user.click(within(aviso).getByRole('button', { name: 'Desactivar' }))

    expect(await screen.findByText('Nadie de su personal puede entrar. Sus datos se conservan.')).toBeInTheDocument()
    expect(api.llamadas('patch', FICHA)[0]?.body).toEqual({ is_active: false })
    expect(screen.getByRole('button', { name: 'Activar restaurante' })).toBeInTheDocument()
  })

  it('activar un local desactivado va directo', async () => {
    const { api, guardar, user } = abrirFicha(fichaDeRestaurante({ is_active: false }))
    api.on('patch', FICHA, () => guardar(fichaDeRestaurante()))

    await user.click(await screen.findByRole('button', { name: 'Activar restaurante' }))

    expect(await screen.findByRole('button', { name: 'Desactivar restaurante' })).toBeInTheDocument()
    expect(api.llamadas('patch', FICHA)[0]?.body).toEqual({ is_active: true })
  })
})

describe('RestaurantDetailView: encargados y errores', () => {
  it('agrega otro encargado y lo suma a la lista', async () => {
    const { api, guardar, user } = abrirFicha()
    const marta = { id: 31, full_name: MARTA_RIOS, email: MARTA_ESQUINA_PE, is_active: true }
    api.on('post', `${FICHA}/owners`, () => {
      const ficha = fichaDeRestaurante()
      guardar({ ...ficha, owners: [...ficha.owners, marta] })
      return marta
    })

    await user.click(await screen.findByRole('button', { name: AGREGAR_ENCARGADO }))
    const ventana = await screen.findByRole('dialog', { name: AGREGAR_ENCARGADO })
    await user.type(within(ventana).getByLabelText('Nombre completo'), MARTA_RIOS)
    await user.type(within(ventana).getByLabelText('Correo'), MARTA_ESQUINA_PE)
    await user.type(within(ventana).getByLabelText('Contraseña inicial'), CLAVE_SEGURA_1)
    await user.click(within(ventana).getByRole('button', { name: AGREGAR_ENCARGADO }))

    expect(await screen.findByText(MARTA_RIOS)).toBeInTheDocument()
    expect(api.llamadas('post', `${FICHA}/owners`)[0]?.body).toEqual({
      full_name: MARTA_RIOS,
      email: MARTA_ESQUINA_PE,
      password: CLAVE_SEGURA_1,
    })
    expect(screen.queryByRole('dialog', { name: AGREGAR_ENCARGADO })).not.toBeInTheDocument()
  })

  it('un correo ya usado lo rechaza el servidor dentro de la ventana', async () => {
    const { api, user } = abrirFicha(fichaDeRestaurante({ owners: [] }))
    api.on('post', `${FICHA}/owners`, new RespuestaDeError(409, 'Ese correo ya tiene una cuenta.'))

    expect(await screen.findByText('Este restaurante no tiene encargados.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: AGREGAR_ENCARGADO }))
    const ventana = await screen.findByRole('dialog')
    await user.type(within(ventana).getByLabelText('Nombre completo'), MARTA_RIOS)
    await user.type(within(ventana).getByLabelText('Correo'), 'lucho@esquina.pe')
    await user.type(within(ventana).getByLabelText('Contraseña inicial'), CLAVE_SEGURA_1)
    await user.click(within(ventana).getByRole('button', { name: AGREGAR_ENCARGADO }))

    expect(await within(ventana).findByText('Ese correo ya tiene una cuenta.')).toBeInTheDocument()
  })

  it('un restaurante que no existe se muestra como «no existe»', async () => {
    abrirFicha(new RespuestaDeError(404, 'No existe'))

    expect(await screen.findByText('Este restaurante no existe.')).toBeInTheDocument()
  })

  it('un identificador inválido en la dirección no llega al servidor', async () => {
    const api = servidor()
    entrarAPlataforma()
    montarPlataforma('/plataforma/restaurantes/abc')

    expect(await screen.findByText('Este restaurante no existe.')).toBeInTheDocument()
    expect(api.peticiones.filter((p) => p.url.startsWith('/platform/restaurants/'))).toHaveLength(0)
  })

  it('otro error se puede reintentar', async () => {
    abrirFicha(new RespuestaDeError(500, 'Servidor caído'))

    expect(await screen.findByText('Servidor caído')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })
})
