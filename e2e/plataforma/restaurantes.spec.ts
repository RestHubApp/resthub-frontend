// Administración del sistema: alta, edición, activación y encargados de los
// restaurantes (HU40), y la lista con su búsqueda y su paginación.
import { CLAVE_NUEVA, Cliente, entrarPorApi, unico } from '../soporte/api'
import { cubre } from '../soporte/cobertura'
import { abrirComo, abrirComoPlataforma, evidencia, expect, test } from '../soporte/fixtures'
import {
  entrarPorFormulario,
  navegacion,
  PAGINA_PLATAFORMA,
  restaurantesConPaginas,
  restaurantesConPrefijo,
} from '../soporte/plataforma'

const FICHA = /\/plataforma\/restaurantes\/\d+$/u

test('PLA-01 el administrador da de alta un restaurante con su encargado y ese encargado entra', async ({ page, plataforma }) => {
  cubre(
    'ruta:/plataforma',
    'ruta:/plataforma/restaurantes/nuevo',
    'ruta:/plataforma/restaurantes/:restaurantId',
    'funcion:plataforma.restaurantes.crear',
    'funcion:plataforma.restaurantes.identificador-sugerido',
    'funcion:plataforma.restaurantes.validar-alta',
    'funcion:acceso.entrar',
  )
  const sufijo = unico()
  const nombre = `Cevichería Ñandú ${sufijo}`
  const correo = `rosa-${sufijo}@e2e.resthub.dev`
  await abrirComoPlataforma(page, plataforma, '/plataforma')
  await page.getByRole('link', { name: 'Nuevo restaurante' }).click()
  await expect(page).toHaveURL(/\/plataforma\/restaurantes\/nuevo$/u)
  await expect(page.getByRole('heading', { name: 'Nuevo restaurante', level: 1 })).toBeVisible()

  await page.getByRole('button', { name: 'Crear restaurante' }).click()
  await expect(page.getByText('Escribe el nombre del restaurante')).toBeVisible()
  await expect(page.getByText('Escribe el identificador')).toBeVisible()
  await expect(page.getByText('Escribe el nombre completo')).toBeVisible()
  await expect(page.getByText('Usa al menos 10 caracteres')).toBeVisible()
  await evidencia(page, 'pla-01-validacion')

  await page.getByLabel('Nombre', { exact: true }).fill(nombre)
  await expect(page.getByLabel('Identificador')).toHaveValue(`cevicheria-nandu-${sufijo.toLowerCase()}`)
  await expect(page.getByLabel('Zona horaria')).toHaveValue('America/Lima')
  await page.getByLabel('Nombre completo').fill('Rosa Quispe Rojas')
  await page.getByLabel('Correo').fill(correo)
  await page.getByLabel('Contraseña inicial', { exact: true }).fill(CLAVE_NUEVA)
  await evidencia(page, 'pla-01-formulario')
  await page.getByRole('button', { name: 'Crear restaurante' }).click()

  await expect(page).toHaveURL(FICHA)
  await expect(page.getByRole('heading', { name: nombre, level: 1 })).toBeVisible()
  await expect(page.getByText('Restaurante creado. Su encargado ya puede entrar con su correo.')).toBeVisible()
  await expect(page.getByText('Activo', { exact: true })).toBeVisible()
  await expect(page.getByText(correo)).toBeVisible()
  await evidencia(page, 'pla-01-ficha')

  // El encargado nuevo entra por el acceso de siempre y ve su local.
  await page.goto('/acceso')
  await entrarPorFormulario(page, correo, CLAVE_NUEVA)
  await expect(page).toHaveURL(/\/pedidos$/u)
  await expect(page.getByText(nombre).first()).toBeVisible()
  await expect(navegacion(page).getByRole('link', { name: 'Personal' })).toBeVisible()
  await evidencia(page, 'pla-01-encargado-entra')
})

test('PLA-02 el alta rechaza un identificador ya usado y «Cancelar» vuelve a la lista', async ({ page, plataforma, local }) => {
  cubre('estado:plataforma.restaurantes.alta-error', 'funcion:plataforma.restaurantes.cancelar-alta', 'ruta:/plataforma/restaurantes/nuevo')
  const sufijo = unico()
  await abrirComoPlataforma(page, plataforma, '/plataforma/restaurantes/nuevo')
  await page.getByLabel('Nombre', { exact: true }).fill('Otro Restaurante')
  await page.getByLabel('Identificador').fill(local.slug)
  await page.getByLabel('Nombre completo').fill('Luis Torres')
  await page.getByLabel('Correo').fill(`luis-${sufijo}@e2e.resthub.dev`)
  await page.getByLabel('Contraseña inicial', { exact: true }).fill(CLAVE_NUEVA)
  await page.getByRole('button', { name: 'Crear restaurante' }).click()
  // El formulario lo dice en su mensaje y el aviso general de la ventana lo repite.
  await expect(page.getByText(`Ya existe un restaurante con el identificador '${local.slug}'.`).first()).toBeVisible()
  await expect(page).toHaveURL(/\/plataforma\/restaurantes\/nuevo$/u)
  await evidencia(page, 'pla-02-identificador-repetido')
  await page.getByRole('button', { name: 'Cancelar' }).click()
  await expect(page).toHaveURL(/\/plataforma$/u)
  await expect(page.getByRole('heading', { name: 'Restaurantes', level: 1 })).toBeVisible()
})

test('PLA-03 el administrador cambia el nombre y la zona horaria de un restaurante', async ({ page, plataforma, local }) => {
  cubre('funcion:plataforma.restaurante.editar', 'ruta:/plataforma/restaurantes/:restaurantId')
  const nuevo = `Restaurante Editado ${unico()}`
  await abrirComoPlataforma(page, plataforma, `/plataforma/restaurantes/${String(local.id)}`)
  await expect(page.getByRole('heading', { name: local.nombre, level: 1 })).toBeVisible()
  const guardar = page.getByRole('button', { name: 'Guardar cambios' })
  await expect(guardar).toBeDisabled()
  await page.getByLabel('Nombre', { exact: true }).fill(nuevo)
  await page.getByLabel('Zona horaria').selectOption('America/Bogota')
  await guardar.click()
  await expect(page.getByText('Cambios guardados.')).toBeVisible()
  await expect(page.getByRole('heading', { name: nuevo, level: 1 })).toBeVisible()
  await expect(guardar).toBeDisabled()
  await evidencia(page, 'pla-03-guardado')
  const ficha = await new Cliente(local.http, plataforma.token).get(`/platform/restaurants/${String(local.id)}`)
  expect(ficha).toMatchObject({ name: nuevo, timezone: 'America/Bogota' })
})

test('PLA-04 desactivar un restaurante corta el acceso de su personal y activarlo lo devuelve', async ({ page, plataforma, local, browser }) => {
  cubre(
    'confirmacion:platform/RestaurantStatusButton',
    'funcion:plataforma.restaurante.desactivar',
    'funcion:plataforma.restaurante.activar',
    'estado:acceso.restaurante-desactivado',
  )
  const celular = await browser.newContext()
  const mesero = await celular.newPage()
  await abrirComo(mesero, local.mesero, '/pedidos')
  await expect(navegacion(mesero).getByRole('link', { name: 'Clientes' })).toBeVisible()

  await abrirComoPlataforma(page, plataforma, `/plataforma/restaurantes/${String(local.id)}`)
  const desactivar = page.getByRole('button', { name: 'Desactivar restaurante' })
  const confirmacion = page.getByRole('alertdialog', { name: `¿Desactivar ${local.nombre}?` })
  await desactivar.click()
  await expect(confirmacion).toContainText('las 3 cuentas de su personal')
  await confirmacion.getByRole('button', { name: 'Cancelar' }).click()
  await expect(confirmacion).toBeHidden()
  await expect(page.getByRole('heading', { name: 'Restaurante activo' })).toBeVisible()

  await desactivar.click()
  await evidencia(page, 'pla-04-confirmar')
  await confirmacion.getByRole('button', { name: 'Desactivar' }).click()
  await expect(page.getByRole('heading', { name: 'Restaurante desactivado' })).toBeVisible()
  await expect(page.getByText('Inactivo', { exact: true })).toBeVisible()
  await evidencia(page, 'pla-04-desactivado')

  // El mesero que tenía la aplicación abierta sale en su siguiente petición.
  await navegacion(mesero).getByRole('link', { name: 'Clientes' }).click()
  await expect(mesero).toHaveURL(/\/acceso$/u)
  await entrarPorFormulario(mesero, local.mesero.email, local.mesero.password)
  await expect(mesero.getByText('El restaurante de esta cuenta está desactivado.')).toBeVisible()
  await evidencia(mesero, 'pla-04-acceso-cortado')

  await page.getByRole('button', { name: 'Activar restaurante' }).click()
  await expect(page.getByRole('heading', { name: 'Restaurante activo' })).toBeVisible()
  await mesero.getByRole('button', { name: 'Entrar' }).click()
  // Vuelve a la pantalla que estaba abriendo cuando se cortó el acceso.
  await expect(mesero).toHaveURL(/\/clientes$/u)
  await celular.close()
})

test('PLA-05 el administrador agrega otro encargado y rechaza un correo ya usado', async ({ page, plataforma, local }) => {
  cubre('dialogo:platform/OwnersSection', 'funcion:plataforma.restaurante.agregar-encargado', 'estado:plataforma.restaurante.encargado-error')
  const correo = `segundo-${unico()}@e2e.resthub.dev`
  await abrirComoPlataforma(page, plataforma, `/plataforma/restaurantes/${String(local.id)}`)
  const agregar = page.getByRole('button', { name: 'Agregar encargado' })
  const ventana = page.getByRole('dialog', { name: 'Agregar encargado' })
  await agregar.click()
  await expect(ventana).toBeVisible()
  await ventana.getByRole('button', { name: 'Cancelar' }).click()
  await expect(ventana).toBeHidden()

  await agregar.click()
  await ventana.getByRole('button', { name: 'Agregar encargado' }).click()
  await expect(ventana.getByText('Escribe el nombre completo')).toBeVisible()
  await ventana.getByLabel('Nombre completo').fill('Carmen Salas')
  await ventana.getByLabel('Correo').fill(local.mesero.email)
  await ventana.getByLabel('Contraseña inicial', { exact: true }).fill(CLAVE_NUEVA)
  await ventana.getByRole('button', { name: 'Agregar encargado' }).click()
  await expect(ventana.getByText(`Ya existe una cuenta con el correo '${local.mesero.email}'.`)).toBeVisible()
  await evidencia(page, 'pla-05-correo-repetido')

  await ventana.getByLabel('Correo').fill(correo)
  await ventana.getByRole('button', { name: 'Agregar encargado' }).click()
  await expect(ventana).toBeHidden()
  const encargados = page.getByRole('listitem').filter({ hasText: correo })
  await expect(encargados).toContainText('Carmen Salas')
  await expect(encargados).toContainText('Activa')
  await evidencia(page, 'pla-05-encargado-agregado')
  const sesion = await entrarPorApi(local.http, correo, CLAVE_NUEVA)
  expect(sesion.cuenta).toMatchObject({ user: { role_label: 'Encargado' }, restaurant: { id: local.id } })
})

test('PLA-06 la lista de restaurantes se busca por nombre o identificador y se pagina', async ({ page, plataforma, local }) => {
  cubre('funcion:plataforma.restaurantes.buscar', 'funcion:plataforma.restaurantes.paginar', 'estado:plataforma.restaurantes.vacio', 'ruta:/plataforma')
  // En una base recién sembrada faltan restaurantes para una segunda página:
  // se dan de alta de a uno, y eso pasa una sola vez por base.
  test.setTimeout(120_000)
  const api = new Cliente(local.http, plataforma.token)
  const prefijo = `Paginado ${unico()}`
  await restaurantesConPaginas(api)
  await restaurantesConPrefijo(api, prefijo, 2)
  await abrirComoPlataforma(page, plataforma, '/plataforma')
  const buscar = page.getByRole('searchbox', { name: 'Buscar por nombre o identificador' })
  const filas = page.getByRole('row').filter({ has: page.getByRole('link') })

  // Sin búsqueda: 25 por página, los más nuevos primero.
  await expect(filas).toHaveCount(PAGINA_PLATAFORMA)
  await expect(page.getByText(/^Página 1 de \d+$/u)).toBeVisible()
  // Cada fila lleva su identificador, que no se repite.
  const primera = await filas.first().innerText()
  await evidencia(page, 'pla-06-pagina-1')
  await page.getByRole('button', { name: 'Siguiente' }).click()
  await expect(page.getByText(/^Página 2 de \d+$/u)).toBeVisible()
  await expect(filas.first()).not.toHaveText(primera)
  await page.getByRole('button', { name: 'Anterior' }).click()
  await expect(page.getByText(/^Página 1 de \d+$/u)).toBeVisible()

  await buscar.fill(prefijo)
  await expect(page.getByRole('heading', { name: '2 restaurantes' })).toBeVisible()
  // eslint-disable-next-line security/detect-non-literal-regexp -- patrón armado con datos fijos de la propia prueba, sin entradas de usuarios
  await expect(filas).toHaveText([new RegExp(`${prefijo} 02`, 'u'), new RegExp(`${prefijo} 01`, 'u')])
  await expect(page.getByText(/^Página \d+ de/u)).toBeHidden()
  await evidencia(page, 'pla-06-busqueda')

  await buscar.fill(local.slug)
  await expect(page.getByRole('heading', { name: '1 restaurante', exact: true })).toBeVisible()
  await expect(filas).toContainText(local.slug)
  await filas.getByRole('link', { name: local.nombre }).click()
  // eslint-disable-next-line security/detect-non-literal-regexp -- patrón armado con datos fijos de la propia prueba, sin entradas de usuarios
  await expect(page).toHaveURL(new RegExp(`/plataforma/restaurantes/${String(local.id)}$`, 'u'))
  await page.getByRole('link', { name: 'Restaurantes' }).first().click()

  await buscar.fill(`no-existe-${unico()}`)
  await expect(page.getByText('Ningún restaurante coincide con la búsqueda.')).toBeVisible()
  await expect(page.getByRole('heading', { name: '0 restaurantes' })).toBeVisible()
  await evidencia(page, 'pla-06-sin-resultados')
})
