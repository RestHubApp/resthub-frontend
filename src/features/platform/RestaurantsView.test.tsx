import { describe, expect, it } from '@jest/globals'
import { screen, waitFor, within } from '@testing-library/react'

import { entrarAPlataforma, fichaDeRestaurante, montarPlataforma, resumenDeRestaurante } from '#jest/fixtures/plataforma'
import { RespuestaDeError, servidor } from '#jest/harness'

// Contraseña de prueba, no una credencial real.
const CLAVE_DE_PRUEBA = 'clave-segura-1'

const CAFE_NANDU = 'Café Ñandú'
const SLUG_CAFE_NANDU = 'cafe-nandu'
const PLATAFORMA_RESTAURANTES_NUEVO = '/plataforma/restaurantes/nuevo'
const CREAR_RESTAURANTE = 'Crear restaurante'

const LISTA = '/platform/restaurants'
const BUSCAR = 'Buscar por nombre o identificador'

function abrirLista(respuesta: unknown = { items: [resumenDeRestaurante()], total: 1 }) {
  const api = servidor().on('get', LISTA, respuesta)
  entrarAPlataforma()
  return { api, ...montarPlataforma('/plataforma') }
}

describe('RestaurantsView', () => {
  it('lista los restaurantes con su identificador, personal y estado', async () => {
    abrirLista()

    const fila = await screen.findByRole('row', { name: /La Esquina de Lucho/u })
    expect(within(fila).getByText('la-esquina-de-lucho')).toBeInTheDocument()
    expect(within(fila).getByText('3 de 4 activas')).toBeInTheDocument()
    expect(within(fila).getByRole('link', { name: 'La Esquina de Lucho' })).toHaveAttribute('href', '/plataforma/restaurantes/4')
    expect(screen.getByText('1 restaurante')).toBeInTheDocument()
  })

  it('busca por nombre en el servidor y desde la primera página', async () => {
    const { api, user } = abrirLista()
    await screen.findByRole('row', { name: /La Esquina/u })
    api.on('get', LISTA, { items: [], total: 0 })

    await user.type(screen.getByRole('searchbox', { name: BUSCAR }), 'pollos')

    expect(await screen.findByText('Ningún restaurante coincide con la búsqueda.')).toBeInTheDocument()
    expect(api.llamadas('get', LISTA).at(-1)?.params).toEqual({ limit: 25, offset: 0, search: 'pollos' })
  })

  it('con más de una página ofrece pasar a la siguiente', async () => {
    const { api, user } = abrirLista({ items: [resumenDeRestaurante()], total: 30 })
    await screen.findByText('30 restaurantes')

    await user.click(screen.getByRole('button', { name: /siguiente/iu }))

    await waitFor(() => {
      expect(api.llamadas('get', LISTA).at(-1)?.params).toEqual({ limit: 25, offset: 25 })
    })
  })

  it('si la lista falla, deja reintentar', async () => {
    const { api, user } = abrirLista(new RespuestaDeError(500, 'Servidor caído'))

    expect(await screen.findByText('Servidor caído')).toBeInTheDocument()
    api.on('get', LISTA, { items: [resumenDeRestaurante()], total: 1 })
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByRole('row', { name: /La Esquina de Lucho/u })).toBeInTheDocument()
  })

  it('sin restaurantes lo dice', async () => {
    abrirLista({ items: [], total: 0 })

    expect(await screen.findByText('Todavía no hay restaurantes.')).toBeInTheDocument()
  })
})

describe('NewRestaurantView', () => {
  async function llenarAlta(user: ReturnType<typeof montarPlataforma>['user']) {
    await user.type(await screen.findByLabelText('Nombre'), CAFE_NANDU)
    await user.type(screen.getByLabelText('Nombre completo'), 'Rosa Díaz')
    await user.type(screen.getByLabelText('Correo'), 'rosa@nandu.pe')
    await user.type(screen.getByLabelText('Contraseña inicial'), CLAVE_DE_PRUEBA)
  }

  it('sugiere el identificador desde el nombre y crea el local con su encargado', async () => {
    const api = servidor().on('get', LISTA, { items: [], total: 0 })
    api.on('post', LISTA, fichaDeRestaurante({ id: 12, name: CAFE_NANDU, slug: SLUG_CAFE_NANDU }))
    api.on('get', `${LISTA}/12`, fichaDeRestaurante({ id: 12, name: CAFE_NANDU, slug: SLUG_CAFE_NANDU }))
    entrarAPlataforma()
    const { user, router } = montarPlataforma(PLATAFORMA_RESTAURANTES_NUEVO)

    await llenarAlta(user)
    expect(screen.getByLabelText('Identificador')).toHaveValue(SLUG_CAFE_NANDU)
    await user.click(screen.getByRole('button', { name: CREAR_RESTAURANTE }))

    expect(await screen.findByText('Restaurante creado. Su encargado ya puede entrar con su correo.')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/plataforma/restaurantes/12')
    expect(api.llamadas('post', LISTA)[0]?.body).toEqual({
      name: CAFE_NANDU,
      slug: SLUG_CAFE_NANDU,
      timezone: 'America/Lima',
      owner: { full_name: 'Rosa Díaz', email: 'rosa@nandu.pe', password: CLAVE_DE_PRUEBA },
    })
  })

  it('un identificador editado a mano ya no sigue al nombre', async () => {
    servidor()
    entrarAPlataforma()
    const { user } = montarPlataforma(PLATAFORMA_RESTAURANTES_NUEVO)

    await user.type(await screen.findByLabelText('Nombre'), 'Pollos')
    await user.clear(screen.getByLabelText('Identificador'))
    await user.type(screen.getByLabelText('Identificador'), 'Mi Pollo')
    await user.type(screen.getByLabelText('Nombre'), ' Hermanos')

    expect(screen.getByLabelText('Identificador')).toHaveValue('mi-pollo')
  })

  it('si el identificador ya existe, muestra el motivo y no sale del alta', async () => {
    const api = servidor().on('post', LISTA, new RespuestaDeError(409, 'Ya hay un restaurante con ese identificador.'))
    entrarAPlataforma()
    const { user, router } = montarPlataforma(PLATAFORMA_RESTAURANTES_NUEVO)

    await llenarAlta(user)
    await user.click(screen.getByRole('button', { name: CREAR_RESTAURANTE }))

    expect(await screen.findByText('Ya hay un restaurante con ese identificador.')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(PLATAFORMA_RESTAURANTES_NUEVO)
    expect(api.llamadas('post', LISTA)).toHaveLength(1)
  })

  it('valida los datos antes de enviar y cancelar vuelve a la lista', async () => {
    const api = servidor().on('get', LISTA, { items: [], total: 0 })
    entrarAPlataforma()
    const { user, router } = montarPlataforma(PLATAFORMA_RESTAURANTES_NUEVO)

    await user.click(await screen.findByRole('button', { name: CREAR_RESTAURANTE }))
    expect(await screen.findByText('Escribe el nombre del restaurante')).toBeInTheDocument()
    expect(screen.getByText('Escribe el identificador')).toBeInTheDocument()
    expect(api.llamadas('post', LISTA)).toHaveLength(0)

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(router.state.location.pathname).toBe('/plataforma')
  })
})
