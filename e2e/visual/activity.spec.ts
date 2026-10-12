// Regresión visual de la bitácora del restaurante y de la ventana para enviar
// un comprobante por correo.
import { covers } from '../support/coverage'
import { openAs } from '../support/fixtures'
import { issueSalesReceipt, id, sell } from '../support/management'
import { capture, captureWindow, expect, deadline, test } from './capture'

const ENTRIES = [
  { id: 3, kind: 'customer_revealed', kind_label: 'Vio completos los datos de un cliente', detail: '', user_id: 2, user_name: 'Mesero Prueba', user_role_id: 2, user_role_label: 'Mesero', occurred_at: '2026-10-12T17:05:00Z' },
  { id: 2, kind: 'customer_viewed', kind_label: 'Abrió la ficha de un cliente', detail: '', user_id: 2, user_name: 'Mesero Prueba', user_role_id: 2, user_role_label: 'Mesero', occurred_at: '2026-10-12T17:04:00Z' },
  { id: 1, kind: 'signed_in', kind_label: 'Inició sesión', detail: '', user_id: 1, user_name: 'Encargada Prueba', user_role_id: 1, user_role_label: 'Encargado', occurred_at: '2026-10-12T17:00:00Z' },
]

test('VIS-19 la bitácora del restaurante', async ({ page, local }) => {
  deadline(60_000)
  covers('ruta:/bitacora')
  // Lo que depende de cada corrida (horas, cuentas) llega fijo.
  await page.route('**/api/v1/activity?*', (route) => route.fulfill({ json: { items: ENTRIES, total: ENTRIES.length } }))

  await openAs(page, local.owner, '/bitacora')
  await expect(page.getByRole('heading', { name: 'Bitácora', level: 1 })).toBeVisible()
  await expect(page.getByText('Vio completos los datos de un cliente')).toBeVisible()
  await capture(page, 'bitacora')
})

test('VIS-20 la ventana para enviar el comprobante por correo', async ({ page, restaurantWithCashRegister: local }) => {
  deadline(90_000)
  covers('dialogo:orders/invoice/InvoiceEmailDialog')
  const order = await sell(local, { table: local.table('1'), items: [{ dish: local.dish('Chicha morada') }] })
  await issueSalesReceipt(local, id(order))
  await page.route('**/api/v1/billing/capabilities', (route) =>
    route.fulfill({ json: { email_enabled: true, email_max_per_hour: 20, archive_enabled: false } }),
  )

  await openAs(page, local.owner, `/pedidos/${String(id(order))}`)
  await page.getByRole('button', { name: 'Enviar por correo' }).click()
  const dialog = page.getByRole('dialog', { name: 'Enviar por correo' })
  await dialog.getByLabel('Correo de quien lo recibe').fill('rosa@correo.pe')
  await captureWindow(dialog, 'dialogo-comprobante-correo')
})
