// Administración del sistema: alta, edición, activación y encargados de los
// restaurantes (HU40), y la lista con su búsqueda y su paginación.
import { NEW_SECRET, Customer, signInByApi, unique } from '../support/api'
import { covers } from '../support/coverage'
import { openAs, openAsPlatform, evidence, expect, test } from '../support/fixtures'
import {
  signInByForm,
  navigation,
  PAGE_PLATFORM,
  restaurantsWithPages,
  restaurantsWithPrefix,
} from '../support/platform'

const CARD = /\/plataforma\/restaurantes\/\d+$/u

test('PLA-01 el administrador da de alta un restaurante con su encargado y ese encargado entra', async ({ page, platform }) => {
  covers(
    'ruta:/plataforma',
    'ruta:/plataforma/restaurantes/nuevo',
    'ruta:/plataforma/restaurantes/:restaurantId',
    'funcion:plataforma.restaurantes.crear',
    'funcion:plataforma.restaurantes.identificador-sugerido',
    'funcion:plataforma.restaurantes.validar-alta',
    'funcion:acceso.entrar',
    'funcion:acceso.consentimientos-separados',
  )
  const suffix = unique()
  const name = `Cevichería Ñandú ${suffix}`
  const email = `rosa-${suffix}@e2e.resthub.dev`
  await openAsPlatform(page, platform, '/plataforma')
  await page.getByRole('link', { name: 'Nuevo restaurante' }).click()
  await expect(page).toHaveURL(/\/plataforma\/restaurantes\/nuevo$/u)
  await expect(page.getByRole('heading', { name: 'Nuevo restaurante', level: 1 })).toBeVisible()

  await page.getByRole('button', { name: 'Crear restaurante' }).click()
  await expect(page.getByText('Escribe el nombre del restaurante')).toBeVisible()
  await expect(page.getByText('Escribe el identificador')).toBeVisible()
  await expect(page.getByText('Escribe el nombre completo')).toBeVisible()
  await expect(page.getByText('Usa al menos 10 caracteres')).toBeVisible()
  await evidence(page, 'pla-01-validacion')

  await page.getByLabel('Nombre', { exact: true }).fill(name)
  await expect(page.getByLabel('Identificador')).toHaveValue(`cevicheria-nandu-${suffix.toLowerCase()}`)
  await expect(page.getByLabel('Zona horaria')).toHaveValue('America/Lima')
  await page.getByLabel('Nombre completo').fill('Rosa Quispe Rojas')
  await page.getByLabel('Correo').fill(email)
  await page.getByLabel('Contraseña inicial', { exact: true }).fill(NEW_SECRET)
  await evidence(page, 'pla-01-formulario')
  await page.getByRole('button', { name: 'Crear restaurante' }).click()

  await expect(page).toHaveURL(CARD)
  await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible()
  await expect(page.getByText('Restaurante creado. Su encargado ya puede entrar con su correo.')).toBeVisible()
  await expect(page.getByText('Activo', { exact: true })).toBeVisible()
  await expect(page.getByText(email)).toBeVisible()
  await evidence(page, 'pla-01-ficha')

  // El encargado nuevo entra por el acceso de siempre y ve su local.
  await page.goto('/acceso')
  await signInByForm(page, email, NEW_SECRET)
  // La contraseña inicial la eligió otra persona: primero elige la suya (RFS-20).
  const own = `propia-${suffix}`
  await expect(page.getByRole('heading', { level: 1, name: 'Cambia tu contraseña' })).toBeVisible()
  await page.getByLabel('Contraseña actual').fill(NEW_SECRET)
  await page.getByLabel('Nueva contraseña', { exact: true }).fill(own)
  await page.getByLabel('Repite la nueva contraseña').fill(own)
  await page.getByRole('button', { name: 'Cambiar contraseña' }).click()
  // Su primer acceso: da dos consentimientos separados (Ley N.º 29733).
  await expect(page.getByRole('heading', { name: 'Antes de empezar' })).toBeVisible()
  await expect(page.getByRole('link', { name: /términos y condiciones/u })).toHaveAttribute('href', '/terminos')
  await expect(page.getByRole('link', { name: /datos personales/u })).toHaveAttribute('href', '/privacidad')
  const proceed = page.getByRole('button', { name: 'Continuar' })
  await expect(proceed).toBeDisabled()
  await page.getByRole('checkbox', { name: /términos y condiciones del servicio/u }).check()
  await expect(proceed).toBeDisabled()
  await evidence(page, 'pla-01-terminos')
  await page.getByRole('checkbox', { name: /tratamiento de mis datos personales/u }).check()
  await proceed.click()
  await expect(page).toHaveURL(/\/pedidos$/u)
  await expect(page.getByText(name).first()).toBeVisible()
  await expect(navigation(page).getByRole('link', { name: 'Personal' })).toBeVisible()
  await evidence(page, 'pla-01-encargado-entra')
})

test('PLA-02 el alta rechaza un identificador ya usado y «Cancelar» vuelve a la lista', async ({ page, platform, local }) => {
  covers('estado:plataforma.restaurantes.alta-error', 'funcion:plataforma.restaurantes.cancelar-alta', 'ruta:/plataforma/restaurantes/nuevo')
  const suffix = unique()
  await openAsPlatform(page, platform, '/plataforma/restaurantes/nuevo')
  await page.getByLabel('Nombre', { exact: true }).fill('Otro Restaurante')
  await page.getByLabel('Identificador').fill(local.slug)
  await page.getByLabel('Nombre completo').fill('Luis Torres')
  await page.getByLabel('Correo').fill(`luis-${suffix}@e2e.resthub.dev`)
  await page.getByLabel('Contraseña inicial', { exact: true }).fill(NEW_SECRET)
  await page.getByRole('button', { name: 'Crear restaurante' }).click()
  // El formulario lo dice en su mensaje y el aviso general de la ventana lo repite.
  await expect(page.getByText(`Ya existe un restaurante con el identificador '${local.slug}'.`).first()).toBeVisible()
  await expect(page).toHaveURL(/\/plataforma\/restaurantes\/nuevo$/u)
  await evidence(page, 'pla-02-identificador-repetido')
  await page.getByRole('button', { name: 'Cancelar' }).click()
  await expect(page).toHaveURL(/\/plataforma$/u)
  await expect(page.getByRole('heading', { name: 'Restaurantes', level: 1 })).toBeVisible()
})

test('PLA-03 el administrador cambia el nombre y la zona horaria de un restaurante', async ({ page, platform, local }) => {
  covers('funcion:plataforma.restaurante.editar', 'ruta:/plataforma/restaurantes/:restaurantId')
  const fresh = `Restaurante Editado ${unique()}`
  await openAsPlatform(page, platform, `/plataforma/restaurantes/${String(local.id)}`)
  await expect(page.getByRole('heading', { name: local.name, level: 1 })).toBeVisible()
  const save = page.getByRole('button', { name: 'Guardar cambios' })
  await expect(save).toBeDisabled()
  await page.getByLabel('Nombre', { exact: true }).fill(fresh)
  await page.getByLabel('Zona horaria').selectOption('America/Bogota')
  await save.click()
  await expect(page.getByText('Cambios guardados.')).toBeVisible()
  await expect(page.getByRole('heading', { name: fresh, level: 1 })).toBeVisible()
  await expect(save).toBeDisabled()
  await evidence(page, 'pla-03-guardado')
  const card = await new Customer(local.http, platform.token).get(`/platform/restaurants/${String(local.id)}`)
  expect(card).toMatchObject({ name: fresh, timezone: 'America/Bogota' })
})

test('PLA-04 desactivar un restaurante corta el acceso de su personal y activarlo lo devuelve', async ({ page, platform, local, browser }) => {
  covers(
    'confirmacion:platform/RestaurantStatusButton',
    'funcion:plataforma.restaurante.desactivar',
    'funcion:plataforma.restaurante.activar',
    'estado:acceso.restaurante-desactivado',
  )
  const mobile = await browser.newContext()
  const waiter = await mobile.newPage()
  await openAs(waiter, local.waiter, '/pedidos')
  await expect(navigation(waiter).getByRole('link', { name: 'Clientes' })).toBeVisible()

  await openAsPlatform(page, platform, `/plataforma/restaurantes/${String(local.id)}`)
  const deactivate = page.getByRole('button', { name: 'Desactivar restaurante' })
  const confirmation = page.getByRole('alertdialog', { name: `¿Desactivar ${local.name}?` })
  await deactivate.click()
  await expect(confirmation).toContainText('las 3 cuentas de su personal')
  await confirmation.getByRole('button', { name: 'Cancelar' }).click()
  await expect(confirmation).toBeHidden()
  await expect(page.getByRole('heading', { name: 'Restaurante activo' })).toBeVisible()

  await deactivate.click()
  await evidence(page, 'pla-04-confirmar')
  await confirmation.getByRole('button', { name: 'Desactivar' }).click()
  await expect(page.getByRole('heading', { name: 'Restaurante desactivado' })).toBeVisible()
  await expect(page.getByText('Inactivo', { exact: true })).toBeVisible()
  await evidence(page, 'pla-04-desactivado')

  // El mesero que tenía la aplicación abierta sale en su siguiente petición.
  await navigation(waiter).getByRole('link', { name: 'Clientes' }).click()
  await expect(waiter).toHaveURL(/\/acceso$/u)
  await signInByForm(waiter, local.waiter.email, local.waiter.password)
  await expect(waiter.getByText('El restaurante de esta cuenta está desactivado.')).toBeVisible()
  await evidence(waiter, 'pla-04-acceso-cortado')

  await page.getByRole('button', { name: 'Activar restaurante' }).click()
  await expect(page.getByRole('heading', { name: 'Restaurante activo' })).toBeVisible()
  await waiter.getByRole('button', { name: 'Entrar' }).click()
  // Vuelve a la pantalla que estaba abriendo cuando se cortó el acceso.
  await expect(waiter).toHaveURL(/\/clientes$/u)
  await mobile.close()
})

test('PLA-05 el administrador agrega otro encargado y rechaza un correo ya usado', async ({ page, platform, local }) => {
  covers('dialogo:platform/OwnersSection', 'funcion:plataforma.restaurante.agregar-encargado', 'estado:plataforma.restaurante.encargado-error')
  const email = `segundo-${unique()}@e2e.resthub.dev`
  await openAsPlatform(page, platform, `/plataforma/restaurantes/${String(local.id)}`)
  const add = page.getByRole('button', { name: 'Agregar encargado' })
  const dialog = page.getByRole('dialog', { name: 'Agregar encargado' })
  await add.click()
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Cancelar' }).click()
  await expect(dialog).toBeHidden()

  await add.click()
  await dialog.getByRole('button', { name: 'Agregar encargado' }).click()
  await expect(dialog.getByText('Escribe el nombre completo')).toBeVisible()
  await dialog.getByLabel('Nombre completo').fill('Carmen Salas')
  await dialog.getByLabel('Correo').fill(local.waiter.email)
  await dialog.getByLabel('Contraseña inicial', { exact: true }).fill(NEW_SECRET)
  await dialog.getByRole('button', { name: 'Agregar encargado' }).click()
  await expect(dialog.getByText(`Ya existe una cuenta con el correo '${local.waiter.email}'.`)).toBeVisible()
  await evidence(page, 'pla-05-correo-repetido')

  await dialog.getByLabel('Correo').fill(email)
  await dialog.getByRole('button', { name: 'Agregar encargado' }).click()
  await expect(dialog).toBeHidden()
  const owners = page.getByRole('listitem').filter({ hasText: email })
  await expect(owners).toContainText('Carmen Salas')
  await expect(owners).toContainText('Activa')
  await evidence(page, 'pla-05-encargado-agregado')
  const session = await signInByApi(email, NEW_SECRET)
  expect(session.account).toMatchObject({ user: { role_label: 'Encargado' }, restaurant: { id: local.id } })
})

test('PLA-06 la lista de restaurantes se busca por nombre o identificador y se pagina', async ({ page, platform, local }) => {
  covers('funcion:plataforma.restaurantes.buscar', 'funcion:plataforma.restaurantes.paginar', 'estado:plataforma.restaurantes.vacio', 'ruta:/plataforma')
  // En una base recién sembrada faltan restaurantes para una segunda página:
  // se dan de alta de a uno, y eso pasa una sola vez por base.
  test.setTimeout(120_000)
  const api = new Customer(local.http, platform.token)
  const prefix = `Paginado ${unique()}`
  await restaurantsWithPages(api)
  await restaurantsWithPrefix(api, prefix, 2)
  await openAsPlatform(page, platform, '/plataforma')
  const search = page.getByRole('searchbox', { name: 'Buscar por nombre o identificador' })
  const rows = page.getByRole('row').filter({ has: page.getByRole('link') })

  // Sin búsqueda: 25 por página, los más nuevos primero.
  await expect(rows).toHaveCount(PAGE_PLATFORM)
  await expect(page.getByText(/^Página 1 de \d+$/u)).toBeVisible()
  // Cada fila lleva su identificador, que no se repite.
  const first = await rows.first().innerText()
  await evidence(page, 'pla-06-pagina-1')
  await page.getByRole('button', { name: 'Siguiente' }).click()
  await expect(page.getByText(/^Página 2 de \d+$/u)).toBeVisible()
  await expect(rows.first()).not.toHaveText(first)
  await page.getByRole('button', { name: 'Anterior' }).click()
  await expect(page.getByText(/^Página 1 de \d+$/u)).toBeVisible()

  await search.fill(prefix)
  await expect(page.getByRole('heading', { name: '2 restaurantes' })).toBeVisible()
  // eslint-disable-next-line security/detect-non-literal-regexp -- patrón armado con datos fijos de la propia prueba, sin entradas de usuarios
  await expect(rows).toHaveText([new RegExp(`${prefix} 02`, 'u'), new RegExp(`${prefix} 01`, 'u')])
  await expect(page.getByText(/^Página \d+ de/u)).toBeHidden()
  await evidence(page, 'pla-06-busqueda')

  await search.fill(local.slug)
  await expect(page.getByRole('heading', { name: '1 restaurante', exact: true })).toBeVisible()
  await expect(rows).toContainText(local.slug)
  await rows.getByRole('link', { name: local.name }).click()
  // eslint-disable-next-line security/detect-non-literal-regexp -- patrón armado con datos fijos de la propia prueba, sin entradas de usuarios
  await expect(page).toHaveURL(new RegExp(`/plataforma/restaurantes/${String(local.id)}$`, 'u'))
  await page.getByRole('link', { name: 'Restaurantes' }).first().click()

  await search.fill(`no-existe-${unique()}`)
  await expect(page.getByText('Ningún restaurante coincide con la búsqueda.')).toBeVisible()
  await expect(page.getByRole('heading', { name: '0 restaurantes' })).toBeVisible()
  await evidence(page, 'pla-06-sin-resultados')
})

test('PLA-07 el administrador restablece la contraseña del encargado y este la cambia al entrar', async ({ page, platform, local, browser }) => {
  covers('dialogo:platform/OwnerRow', 'funcion:acceso.entrar', 'funcion:perfil.cambiar-contrasena')
  const temporary = `temporal-${unique()}`
  const chosen = `elegida-${unique()}`
  const { owner } = local
  await openAsPlatform(page, platform, `/plataforma/restaurantes/${String(local.id)}`)
  await page.getByRole('button', { name: `Restablecer la contraseña de ${owner.name}` }).click()
  const dialog = page.getByRole('dialog', { name: `Restablecer la contraseña de ${owner.name}` })
  await dialog.getByLabel('Contraseña temporal').fill(temporary)
  await dialog.getByRole('button', { name: 'Restablecer' }).click()
  await expect(dialog).toBeHidden()
  const row = page.getByRole('listitem').filter({ hasText: owner.email })
  await expect(row).toContainText('Contraseña temporal')
  await evidence(page, 'pla-07-contrasena-temporal')

  // El encargado entra con la temporal y no pasa de «Cambia tu contraseña» hasta cambiarla.
  const context = await browser.newContext()
  const mobile = await context.newPage()
  await mobile.goto('/acceso')
  await signInByForm(mobile, owner.email, temporary)
  await expect(mobile.getByRole('heading', { level: 1, name: 'Cambia tu contraseña' })).toBeVisible()
  await mobile.getByLabel('Contraseña actual').fill(temporary)
  await mobile.getByLabel('Nueva contraseña', { exact: true }).fill(chosen)
  await mobile.getByLabel('Repite la nueva contraseña').fill(chosen)
  await mobile.getByRole('button', { name: 'Cambiar contraseña' }).click()
  await expect(mobile.getByRole('heading', { level: 1, name: 'Cambia tu contraseña' })).toBeHidden()
  await expect(navigation(mobile)).toBeVisible()
  await context.close()
})
