import { describe, expect, it } from '@jest/globals'
import { screen, waitFor, within } from '@testing-library/react'

import { entrarAPlataforma, fichaDeRestaurante, montarPlataforma, resumenDeRestaurante } from '#jest/fixtures/plataforma'
import { RespuestaDeError, servidor } from '#jest/harness'

// Contraseña de prueba, no una credencial real.
const TEST_SECRET = 'clave-segura-1'

const CAFE_NANDU = 'Café Ñandú'
const SLUG_CAFE_NANDU = 'cafe-nandu'
const PLATFORM_NEW_RESTAURANTS = '/plataforma/restaurantes/nuevo'
const CREATE_RESTAURANT = 'Crear restaurante'

const LIST = '/platform/restaurants'
const SEARCH = 'Buscar por nombre o identificador'

function openList(response: unknown = { items: [resumenDeRestaurante()], total: 1 }) {
  const api = servidor().on('get', LIST, response)
  entrarAPlataforma()
  return { api, ...montarPlataforma('/plataforma') }
}

describe('RestaurantsView', () => {
  it('lista los restaurantes con su identificador, personal y estado', async () => {
    openList()

    const row = await screen.findByRole('row', { name: /La Esquina de Lucho/u })
    expect(within(row).getByText('la-esquina-de-lucho')).toBeInTheDocument()
    expect(within(row).getByText('3 de 4 activas')).toBeInTheDocument()
    expect(within(row).getByRole('link', { name: 'La Esquina de Lucho' })).toHaveAttribute('href', '/plataforma/restaurantes/4')
    expect(screen.getByText('1 restaurante')).toBeInTheDocument()
  })

  it('busca por nombre en el servidor y desde la primera página', async () => {
    const { api, user } = openList()
    await screen.findByRole('row', { name: /La Esquina/u })
    api.on('get', LIST, { items: [], total: 0 })

    await user.type(screen.getByRole('searchbox', { name: SEARCH }), 'pollos')

    expect(await screen.findByText('Ningún restaurante coincide con la búsqueda.')).toBeInTheDocument()
    expect(api.llamadas('get', LIST).at(-1)?.params).toEqual({ limit: 25, offset: 0, search: 'pollos' })
  })

  it('con más de una página ofrece pasar a la siguiente', async () => {
    const { api, user } = openList({ items: [resumenDeRestaurante()], total: 30 })
    await screen.findByText('30 restaurantes')

    await user.click(screen.getByRole('button', { name: /siguiente/iu }))

    await waitFor(() => {
      expect(api.llamadas('get', LIST).at(-1)?.params).toEqual({ limit: 25, offset: 25 })
    })
  })

  it('si la lista falla, deja reintentar', async () => {
    const { api, user } = openList(new RespuestaDeError(500, 'Servidor caído'))

    expect(await screen.findByText('Servidor caído')).toBeInTheDocument()
    api.on('get', LIST, { items: [resumenDeRestaurante()], total: 1 })
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByRole('row', { name: /La Esquina de Lucho/u })).toBeInTheDocument()
  })

  it('sin restaurantes lo dice', async () => {
    openList({ items: [], total: 0 })

    expect(await screen.findByText('Todavía no hay restaurantes.')).toBeInTheDocument()
  })
})

describe('NewRestaurantView', () => {
  async function fillRegistration(user: ReturnType<typeof montarPlataforma>['user']) {
    await user.type(await screen.findByLabelText('Nombre'), CAFE_NANDU)
    await user.type(screen.getByLabelText('Nombre completo'), 'Rosa Díaz')
    await user.type(screen.getByLabelText('Correo'), 'rosa@nandu.pe')
    await user.type(screen.getByLabelText('Contraseña inicial'), TEST_SECRET)
  }

  it('sugiere el identificador desde el nombre y crea el local con su encargado', async () => {
    const api = servidor().on('get', LIST, { items: [], total: 0 })
    api.on('post', LIST, fichaDeRestaurante({ id: 12, name: CAFE_NANDU, slug: SLUG_CAFE_NANDU }))
    api.on('get', `${LIST}/12`, fichaDeRestaurante({ id: 12, name: CAFE_NANDU, slug: SLUG_CAFE_NANDU }))
    entrarAPlataforma()
    const { user, router } = montarPlataforma(PLATFORM_NEW_RESTAURANTS)

    await fillRegistration(user)
    expect(screen.getByLabelText('Identificador')).toHaveValue(SLUG_CAFE_NANDU)
    await user.click(screen.getByRole('button', { name: CREATE_RESTAURANT }))

    expect(await screen.findByText('Restaurante creado. Su encargado ya puede entrar con su correo.')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/plataforma/restaurantes/12')
    expect(api.llamadas('post', LIST)[0]?.body).toEqual({
      name: CAFE_NANDU,
      slug: SLUG_CAFE_NANDU,
      timezone: 'America/Lima',
      owner: { full_name: 'Rosa Díaz', email: 'rosa@nandu.pe', password: TEST_SECRET },
    })
  })

  it('un identificador editado a mano ya no sigue al nombre', async () => {
    servidor()
    entrarAPlataforma()
    const { user } = montarPlataforma(PLATFORM_NEW_RESTAURANTS)

    await user.type(await screen.findByLabelText('Nombre'), 'Pollos')
    await user.clear(screen.getByLabelText('Identificador'))
    await user.type(screen.getByLabelText('Identificador'), 'Mi Pollo')
    await user.type(screen.getByLabelText('Nombre'), ' Hermanos')

    expect(screen.getByLabelText('Identificador')).toHaveValue('mi-pollo')
  })

  it('si el identificador ya existe, muestra el motivo y no sale del alta', async () => {
    const api = servidor().on('post', LIST, new RespuestaDeError(409, 'Ya hay un restaurante con ese identificador.'))
    entrarAPlataforma()
    const { user, router } = montarPlataforma(PLATFORM_NEW_RESTAURANTS)

    await fillRegistration(user)
    await user.click(screen.getByRole('button', { name: CREATE_RESTAURANT }))

    expect(await screen.findByText('Ya hay un restaurante con ese identificador.')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(PLATFORM_NEW_RESTAURANTS)
    expect(api.llamadas('post', LIST)).toHaveLength(1)
  })

  it('valida los datos antes de enviar y cancelar vuelve a la lista', async () => {
    const api = servidor().on('get', LIST, { items: [], total: 0 })
    entrarAPlataforma()
    const { user, router } = montarPlataforma(PLATFORM_NEW_RESTAURANTS)

    await user.click(await screen.findByRole('button', { name: CREATE_RESTAURANT }))
    expect(await screen.findByText('Escribe el nombre del restaurante')).toBeInTheDocument()
    expect(screen.getByText('Escribe el identificador')).toBeInTheDocument()
    expect(api.llamadas('post', LIST)).toHaveLength(0)

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(router.state.location.pathname).toBe('/plataforma')
  })
})
