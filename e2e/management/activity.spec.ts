// Prevenir fugas internas (Ley N.º 29733): el contacto del cliente llega
// enmascarado a quien no gestiona clientes, «Ver completo» lo muestra y queda en
// la bitácora, que el encargado puede filtrar por accesos a datos de clientes.
import type { Customer as CustomerData } from '../../src/api/types'
import { covers } from '../support/coverage'
import { openAs, evidence, expect, test } from '../support/fixtures'
import { api, newAccount } from '../support/management'

test('GES-37 una cuenta que solo consulta ve el contacto del cliente oculto, lo abre con «Ver completo» y el encargado lo ve en la bitácora', async ({ page, local }) => {
  covers('ruta:/bitacora', 'funcion:bitacora.ver', 'funcion:bitacora.filtrar-accesos', 'funcion:clientes.ver-completo')
  await api(local).post<CustomerData>('/customers', {
    name: 'Rosa Díaz', phone: '987654321', email: 'rosa@correo.pe', address: '', reference: '', notes: '', consent: true,
  })

  // El mesero de fábrica gestiona clientes y lo ve completo; un rol que solo consulta lo ve oculto.
  const role = await api(local).post<{ readonly id: number }>('/roles', { name: 'Consulta', permissions: ['customers.read', 'menu.read'] })
  const reader = await newAccount(local, 'Consulta Prueba', role.id)
  await openAs(page, reader, '/clientes')
  await page.getByRole('button', { name: /Rosa Díaz/u }).click()
  const card = page.getByRole('dialog', { name: 'Rosa Díaz' })
  await expect(card.getByText('987•••321', { exact: false }).first()).toBeVisible()
  await expect(card.getByText('rosa@correo.pe')).toBeHidden()
  await expect(card.getByText(/Queda registrado quién los ve/u)).toBeVisible()
  await evidence(page, 'ges-37-1-contacto-oculto')
  await card.getByRole('button', { name: 'Ver completo' }).click()
  await expect(card.getByText('987654321 · rosa@correo.pe')).toBeVisible()
  await expect(card.getByRole('button', { name: 'Ver completo' })).toBeHidden()
  await evidence(page, 'ges-37-2-contacto-completo')

  // Otra cuenta en el mismo navegador: se sale de la aplicación antes de cambiar la sesión guardada.
  await page.evaluate(() => {
    localStorage.clear()
  })
  await page.goto('about:blank')
  await openAs(page, local.owner, '/bitacora')
  const log = page.getByRole('region', { name: 'Bitácora del restaurante' })
  await expect(page.getByRole('heading', { name: 'Bitácora', level: 1 })).toBeVisible()
  await expect(log.getByText('Vio completos los datos de un cliente')).toBeVisible()
  await evidence(page, 'ges-37-3-bitacora')

  await page.getByLabel('Mostrar').selectOption({ label: 'Accesos a datos de clientes' })
  await expect(log.getByText('Abrió la ficha de un cliente').first()).toBeVisible()
  await expect(log.getByText('Aceptó los términos y condiciones')).toBeHidden()
  await evidence(page, 'ges-37-4-bitacora-accesos')
})
