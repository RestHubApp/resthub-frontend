// HU36: la libreta de clientes. Alta, búsqueda por nombre o teléfono, la
// ficha con visitas, gasto y ticket promedio (frecuente desde tres visitas) y
// la edición desde la ficha.
import type { Local } from '../soporte/api'
import { cubre } from '../soporte/cobertura'
import { abrirComo, aviso, evidencia, expect, test } from '../soporte/fixtures'
import { api, fallaServidor, id, soles } from '../soporte/gestion'

/** Un pedido del cliente de principio a fin, cobrado con Yape. */
async function pedidoDe(local: Local, clienteId: number, tipo: 'delivery' | 'dine_in'): Promise<void> {
  const mesero = api(local, local.mesero)
  const datos = tipo === 'delivery'
    ? { type: 'delivery', customer_id: clienteId, customer_name: 'Rosa Díaz', customer_phone: '987654321', delivery_address: 'Av. Sol 123' }
    : { type: 'dine_in', table_id: local.mesa('1').id, customer_id: clienteId }
  const pedido = await mesero.post('/orders', { ...datos, items: [{ menu_item_id: local.plato('Chicha morada').id, quantity: 1, notes: '' }] })
  const ruta = `/orders/${String(id(pedido))}`
  await mesero.post(`${ruta}/send`)
  await api(local, local.cocina).post(`${ruta}/ready`)
  await mesero.post(`${ruta}/served`)
  await mesero.post(`${ruta}/charge`, { payment_method: 'yape', tip: '0' })
}

// Cada prueba es un recorrido largo de la pantalla con datos preparados por el
// API; con la máquina compartida por otras suites pasan de los 45 s por omisión.
test.beforeEach(() => {
  test.slow()
})

test('GES-21 el encargado da de alta un cliente, lo busca, ve en su ficha que es frecuente y edita sus datos', async ({ page, localConCaja: local }) => {
  cubre(
    'ruta:/clientes',
    'dialogo:customers/CustomerDialog',
    'hoja:customers/CustomerSheet',
    'funcion:clientes.crear',
    'funcion:clientes.telefono-repetido',
    'funcion:clientes.buscar',
    'funcion:clientes.ver-ficha',
    'funcion:clientes.frecuente',
    'funcion:clientes.editar',
    'estado:clientes.vacio',
    'estado:clientes.sin-resultados',
    'estado:clientes.error',
  )
  await abrirComo(page, local.encargado, '/clientes')
  await expect(page.getByRole('heading', { level: 1, name: 'Clientes' })).toBeVisible()
  await expect(page.getByText('Todavía no hay clientes')).toBeVisible()

  await page.getByRole('button', { name: 'Nuevo cliente' }).click()
  const alta = page.getByRole('dialog', { name: 'Nuevo cliente' })
  await alta.getByLabel('Correo (opcional)').fill('rosa@')
  await alta.getByRole('button', { name: 'Guardar' }).click()
  await expect(alta.getByText('Escribe el nombre')).toBeVisible()
  await expect(alta.getByText('Escribe un correo válido')).toBeVisible()
  await alta.getByLabel('Nombre').fill('Rosa Díaz')
  await alta.getByLabel('Teléfono (opcional)').fill('987654321')
  await alta.getByLabel('Correo (opcional)').fill('rosa@correo.pe')
  await alta.getByLabel('Dirección (opcional)').fill('Av. Sol 123')
  await alta.getByLabel('Referencia (opcional)').fill('Frente al parque')
  await alta.getByLabel('Notas (opcional)').fill('Sin cebolla')
  await evidencia(page, 'ges-21-1-nuevo-cliente')
  await alta.getByRole('button', { name: 'Guardar' }).click()
  await expect(aviso(page, 'Rosa Díaz: datos guardados.')).toBeVisible()
  const fila = page.getByRole('button', { name: /Rosa Díaz/u })
  await expect(fila).toContainText('0 visitas')
  await expect(page.getByRole('heading', { name: '1 cliente' })).toBeVisible()

  // El teléfono identifica al cliente: no se repite.
  await page.getByRole('button', { name: 'Nuevo cliente' }).click()
  await alta.getByLabel('Nombre').fill('Otra Rosa')
  await alta.getByLabel('Teléfono (opcional)').fill('987654321')
  await alta.getByRole('button', { name: 'Guardar' }).click()
  await expect(alta.getByRole('alert').filter({ hasNotText: 'No se pudo guardar. Los datos siguen aquí' })).toContainText('El teléfono 987654321 ya es de Rosa Díaz.')
  await alta.getByRole('button', { name: 'Cancelar' }).click()
  await expect(alta).toBeHidden()

  // Tres pedidos de delivery lo vuelven frecuente.
  const clienteId = id((await api(local).lista('/customers'))[0])
  for (let n = 0; n < 3; n += 1) {
    await pedidoDe(local, clienteId, 'delivery')
  }
  await page.reload()
  await expect(fila).toContainText('Frecuente')
  await expect(fila).toContainText(/3 visitas · S\/\s*24\.00/u)

  const buscar = page.getByRole('searchbox', { name: 'Buscar por nombre o teléfono' })
  await buscar.fill('999')
  await expect(page.getByText('Nadie coincide con la búsqueda')).toBeVisible()
  await buscar.fill('9876')
  await expect(fila).toBeVisible()
  await buscar.fill('rosa')
  await expect(fila).toBeVisible()

  await fila.click()
  const ficha = page.getByRole('dialog', { name: 'Rosa Díaz' })
  await expect(ficha).toContainText('987654321 · rosa@correo.pe')
  const cifra = (nombre: string) => ficha.getByRole('term').filter({ hasText: nombre }).locator('xpath=..')
  await expect(cifra('Visitas')).toContainText('3')
  await expect(cifra('Gastado')).toContainText(soles('24.00'))
  await expect(cifra('Ticket prom.')).toContainText(soles('8.00'))
  await expect(ficha).toContainText('Cliente frecuente')
  await expect(ficha).toContainText('Av. Sol 123 · Ref.: Frente al parque')
  await expect(ficha).toContainText('Sin cebolla')
  await expect(ficha.getByRole('link', { name: /#\d/u })).toHaveCount(3)
  await evidencia(page, 'ges-21-2-ficha')

  await ficha.getByRole('button', { name: 'Editar datos' }).click()
  const edicion = page.getByRole('dialog', { name: 'Editar a Rosa Díaz' })
  await expect(edicion.getByLabel('Dirección (opcional)')).toHaveValue('Av. Sol 123')
  await edicion.getByLabel('Notas (opcional)').fill('Alérgica al maní')
  await edicion.getByRole('button', { name: 'Guardar' }).click()
  await expect(aviso(page, 'Rosa Díaz: datos guardados.')).toBeVisible()
  expect((await api(local).get(`/customers/${String(clienteId)}`)).notes).toBe('Alérgica al maní')

  await fallaServidor(page, '/customers')
  await page.reload()
  await expect(page.getByRole('main').getByRole('button', { name: 'Reintentar' })).toBeVisible()
})

test('GES-22 la ficha del cliente dice el tipo de cada pedido en español', async ({ page, localConCaja: local }) => {
  const cliente = await api(local).post('/customers', { name: 'Julio Paz', phone: '912345678', email: '', address: '', reference: '', notes: '' })
  await pedidoDe(local, id(cliente), 'dine_in')
  await abrirComo(page, local.encargado, '/clientes')
  await page.getByRole('button', { name: /Julio Paz/u }).click()
  const pedido = page.getByRole('dialog', { name: 'Julio Paz' }).getByRole('link', { name: /#1/u })
  await expect(pedido).toBeVisible()
  await evidencia(page, 'ges-22-1-tipo-de-pedido')
  await expect(pedido).toContainText('En mesa')
})

test('GES-25 la ventana de un cliente nuevo abre vacía después de guardar otro', async ({ page, local }) => {
  await abrirComo(page, local.encargado, '/clientes')
  await page.getByRole('button', { name: 'Nuevo cliente' }).click()
  const alta = page.getByRole('dialog', { name: 'Nuevo cliente' })
  await alta.getByLabel('Nombre').fill('Rosa Díaz')
  await alta.getByLabel('Teléfono (opcional)').fill('987654321')
  await alta.getByLabel('Notas (opcional)').fill('Sin cebolla')
  await alta.getByRole('button', { name: 'Guardar' }).click()
  await expect(aviso(page, 'Rosa Díaz: datos guardados.')).toBeVisible()
  await page.getByRole('button', { name: 'Nuevo cliente' }).click()
  await evidencia(page, 'ges-25-1-cliente-nuevo-vacio')
  await expect(alta.getByLabel('Nombre')).toHaveValue('')
  await expect(alta.getByLabel('Teléfono (opcional)')).toHaveValue('')
  await expect(alta.getByLabel('Notas (opcional)')).toHaveValue('')
})
