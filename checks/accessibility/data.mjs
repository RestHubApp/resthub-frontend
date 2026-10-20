// Deja en la base local los datos que hacen falta para abrir cada pantalla y
// cada modal con contenido: un cliente, una reserva, un proveedor con una
// orden de compra enviada, un pedido cobrado con su comprobante y un pedido
// listo para cobrar. Solo contra el backend local (API_URL); es idempotente:
// lo que ya existe no se vuelve a crear.
import { API_URL, PASSWORD, ACCOUNTS, writeJson, REPORTS } from './common.mjs'
import { join } from 'node:path'

async function call(token, method, route, body) {
  const response = await fetch(`${API_URL}/api/v1${route}`, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await response.text()
  const data = text ? JSON.parse(text) : null
  if (!response.ok) throw new Error(`${method} ${route} → ${response.status} ${text.slice(0, 300)}`)
  return data
}

async function token(account) {
  const r = await call(null, 'POST', '/auth/login', { email: ACCOUNTS[account].email, password: PASSWORD })
  // Los datos fiscales y los roles piden la contraseña confirmada (RFS-21). Un
  // backend sin esa ruta responde 404 y se sigue.
  await call(r.access_token, 'POST', '/auth/me/reauthenticate', { password: PASSWORD }).catch(() => undefined)
  return r.access_token
}

// El día en Lima a `days` de hoy.
const dayInLima = (days = 0) => new Date(Date.now() - 5 * 3600_000 + days * 86_400_000).toISOString().slice(0, 10)

// Las cuentas de la semilla aceptan los términos vigentes (Ley N.º 29733): si
// no, cada pantalla mediría la puerta «Antes de empezar». La cuenta
// `sin-terminos` se crea aparte y nunca los acepta, para medir esa puerta.
async function acceptTerms() {
  for (const account of ['owner', 'waiter', 'kitchen']) {
    const r = await call(null, 'POST', '/auth/login', { email: ACCOUNTS[account].email, password: PASSWORD })
    if (!r.terms_accepted || !r.privacy_accepted) {
      await call(r.access_token, 'POST', '/auth/me/terms', { terms_version: r.terms_version, privacy_version: r.privacy_version })
    }
  }
}

async function accountWithoutTerms(t) {
  const waiter = await call(null, 'POST', '/auth/login', { email: ACCOUNTS.waiter.email, password: PASSWORD })
  await call(t, 'POST', '/staff', {
    email: ACCOUNTS['sin-terminos'].email, full_name: 'Mesero nuevo (pruebas a11y)', password: ACCOUNTS['sin-terminos'].password, role_id: waiter.user.role_id,
  }).catch((error) => {
    if (!String(error.message).includes('409')) throw error
  })
}

// Cobrar necesita la caja abierta, y «Turno» necesita un turno ya cerrado: con
// la semilla sola no hay ninguno de los dos.
async function prepareCash(t) {
  const isClosed = (s) => !s.is_open
  const sessions = await call(t, 'GET', '/cash/sessions')
  if (!(sessions.items ?? sessions).some(isClosed)) {
    if (!(await call(t, 'GET', '/cash/current')).is_open) await call(t, 'POST', '/cash/open', { opening_amount: '100.00', notes: '' })
    await call(t, 'POST', '/cash/close', { counted_cash: '100.00', notes: 'Turno de las pruebas de accesibilidad' })
  }
  if (!(await call(t, 'GET', '/cash/current')).is_open) await call(t, 'POST', '/cash/open', { opening_amount: '100.00', notes: '' })
}

export async function prepareData() {
  await acceptTerms()
  const t = await token('owner')
  // La revisión usa la sesión de cada cuenta durante toda la corrida: con el
  // bloqueo por inactividad (RFS-29), una cuenta que pasa diez minutos sin
  // pedir nada mostraría el desbloqueo en vez de su pantalla. Un backend sin
  // ese ajuste lo ignora.
  await call(t, 'PATCH', '/restaurant', { idle_lock_minutes: 0 })
  await prepareCash(t)
  await accountWithoutTerms(t)
  const ids = {}

  // Cliente y reserva.
  const customers = await call(t, 'GET', '/customers')
  let customer = customers.items.find((c) => c.name === 'Lucía Quispe (pruebas a11y)')
  customer ??= await call(t, 'POST', '/customers', {
    name: 'Lucía Quispe (pruebas a11y)', phone: '987654321', email: 'lucia@example.com',
    address: 'Av. Arequipa 123', reference: 'Frente al parque', notes: 'Cliente de las pruebas de accesibilidad',
    consent: true,
  })
  ids.customer = customer.id
  // Mañana y no hoy: una reserva de hoy a las 20:00 ya pasó si la revisión corre de noche.
  const day = dayInLima(1)
  const reservations = await call(t, 'GET', `/reservations?day=${day}`)
  const list = Array.isArray(reservations) ? reservations : reservations.items
  if (!list.some((r) => r.customer_name === 'Lucía Quispe (pruebas a11y)')) {
    await call(t, 'POST', '/reservations', {
      customer_name: 'Lucía Quispe (pruebas a11y)', party_size: 4, reserved_for: `${day}T20:00:00-05:00`,
      phone: '987654321', duration_minutes: 90, notes: 'Cumpleaños', customer_id: customer.id,
    })
  }

  // Proveedor y orden de compra enviada (para «Recibir»).
  const suppliers = await call(t, 'GET', '/inventory/suppliers')
  let supplier = suppliers.find((p) => p.name === 'Mercado Central (pruebas a11y)')
  supplier ??= await call(t, 'POST', '/inventory/suppliers', {
    name: 'Mercado Central (pruebas a11y)', contact: 'Rosa', phone: '912345678', notes: '', is_active: true,
  })
  ids.supplier = supplier.id
  const orders = await call(t, 'GET', '/inventory/purchase-orders')
  if (orders.items.length === 0) {
    const ingredients = await call(t, 'GET', '/inventory/ingredients')
    const ingredientList = Array.isArray(ingredients) ? ingredients : ingredients.items
    const order = await call(t, 'POST', '/inventory/purchase-orders', {
      supplier_id: supplier.id, notes: 'Orden de las pruebas de accesibilidad',
      lines: ingredientList.slice(0, 2).map((i) => ({ ingredient_id: i.id, quantity: '1000', unit_cost: '0.01' })),
    })
    await call(t, 'POST', `/inventory/purchase-orders/${order.id}/send`)
    // Un borrador más, para ver los dos estados.
    await call(t, 'POST', '/inventory/purchase-orders', {
      supplier_id: supplier.id, notes: 'Borrador', lines: [{ ingredient_id: ingredientList[2].id, quantity: '500', unit_cost: '0.02' }],
    })
  }

  // Datos fiscales, un pedido cobrado con comprobante y uno servido por cobrar.
  await call(t, 'PUT', '/billing/settings', {
    ruc: '20123456789', legal_name: 'Restaurante Demo S.A.C.', address: 'Jr. Lima 456, Lima',
    igv_rate: '18.00', boleta_series: 'B001', factura_series: 'F001',
  })
  const menu = await call(t, 'GET', '/menu')
  const dishes = menu.categories.flatMap((c) => c.items ?? [])
  const dish = dishes.find((p) => (p.modifier_groups ?? []).length === 0) ?? dishes[0]
  // Un plato con opciones, para abrir el diálogo de opciones al tomar el pedido.
  const lomo = dishes.find((p) => p.name === 'Lomo saltado') ?? dishes.at(-1)
  if ((lomo.modifier_groups ?? []).length === 0) {
    await call(t, 'PATCH', `/menu/items/${lomo.id}`, {
      modifier_groups: [
        { name: 'Término de la carne', min_choices: 1, max_choices: 1, options: [{ name: 'Tres cuartos', price: '0' }, { name: 'Bien cocido', price: '0' }] },
        { name: 'Extras', min_choices: 0, max_choices: 2, options: [{ name: 'Huevo frito', price: '2.00' }, { name: 'Porción de arroz', price: '3.00' }] },
      ],
    })
    lomo.modifier_groups = [{}]
  }
  const taxInvoices = await call(t, 'GET', '/billing/invoices')
  if (taxInvoices.items.length === 0) {
    const order = await call(t, 'POST', '/orders', { type: 'takeaway', customer_name: 'Lucía Quispe', items: [{ menu_item_id: dish.id, quantity: 2 }] })
    for (const step of ['send', 'ready', 'served']) await call(t, 'POST', `/orders/${order.id}/${step}`).catch(() => undefined)
    const read = await call(t, 'GET', `/orders/${order.id}`)
    await call(t, 'POST', `/orders/${order.id}/charge`, { payment_method: 'cash', amount_received: read.balance ?? read.total, tip: '0', expected_balance: read.balance ?? read.total })
    await call(t, 'POST', '/billing/invoices', { order_id: order.id, kind: 'boleta', customer_document_type: 'dni', customer_document_number: '12345678', customer_name: 'Lucía Quispe', customer_address: '' })
      .catch((e) => console.warn('comprobante:', e.message))
  }
  const chargedInvoices = await call(t, 'GET', '/billing/invoices')
  ids.invoice = chargedInvoices.items[0]?.id ?? null
  ids.orderCharged = chargedInvoices.items[0]?.order_id ?? null

  // Un pedido en mesa servido, del mesero, listo para cobrar (cobro y comprobante).
  const tm = await token('waiter')
  const active = await call(tm, 'GET', '/orders/active')
  let toCharge = active.find((o) => o.notes === 'pruebas a11y')
  if (!toCharge) {
    const tables = await call(tm, 'GET', '/tables')
    const free = tables.find((m) => m.status === 'free' || !m.active_order)
    toCharge = await call(tm, 'POST', '/orders', {
      type: 'dine_in', table_id: free.id, notes: 'pruebas a11y',
      items: dishes.filter((p) => p.id !== lomo.id).slice(0, 3).filter((p) => (p.modifier_groups ?? []).length === 0).map((p) => ({ menu_item_id: p.id, quantity: 1, notes: '' })),
    })
  }
  // El mesero envía; marcar listo y servido lo hace quien tiene la cocina (el encargado).
  if (toCharge.status === 'open') await call(tm, 'POST', `/orders/${toCharge.id}/send`)
  if (['open', 'in_kitchen'].includes(toCharge.status)) await call(t, 'POST', `/orders/${toCharge.id}/ready`)
  if (toCharge.status !== 'served') await call(t, 'POST', `/orders/${toCharge.id}/served`)
  ids.orderToCharge = toCharge.id
  // Un pedido para llevar todavía sin enviar a cocina: sus platos se editan (notas).
  let open = active.find((o) => o.customer_name === 'Sin enviar (pruebas a11y)' && o.status === 'open')
  open ??= await call(tm, 'POST', '/orders', {
    type: 'takeaway', customer_name: 'Sin enviar (pruebas a11y)',
    items: dishes.filter((p) => p.id !== lomo.id).slice(0, 2).map((p) => ({ menu_item_id: p.id, quantity: 1, notes: '' })),
  })
  ids.openOrder = open.id
  ids.orderInKitchen = active.find((o) => o.status === 'in_kitchen')?.id ?? toCharge.id
  ids.dish = dish.id
  ids.dishWithOptions = dishes.find((p) => (p.modifier_groups ?? []).length > 0)?.id ?? null

  // Un pedido cobrado sin comprobante (para «Emitir boleta o factura»).
  const charged = await call(t, 'GET', '/orders?status=paid').catch(() => ({ items: [] }))
  let withoutInvoice = (charged.items ?? charged).find((o) => o.customer_name === 'Sin comprobante (pruebas a11y)')
  if (!withoutInvoice) {
    const order = await call(t, 'POST', '/orders', { type: 'takeaway', customer_name: 'Sin comprobante (pruebas a11y)', items: [{ menu_item_id: dish.id, quantity: 1 }] })
    for (const step of ['send', 'ready', 'served']) await call(t, 'POST', `/orders/${order.id}/${step}`)
    const read = await call(t, 'GET', `/orders/${order.id}`)
    await call(t, 'POST', `/orders/${order.id}/charge`, { payment_method: 'yape', tip: '0', expected_balance: read.balance })
    withoutInvoice = order
  }
  ids.orderWithoutInvoice = withoutInvoice.id

  // Un conteo físico cerrado, para su reporte de diferencias y la tendencia de un insumo.
  const counts = await call(t, 'GET', '/inventory/stock-counts?status=closed&limit=1')
  let closedCount = counts.items[0]
  if (!closedCount) {
    const [first] = await call(t, 'GET', '/inventory/ingredients')
    const opened = await call(t, 'POST', '/inventory/stock-counts', { scope: 'selected', ingredient_ids: [first.id], note: 'Pruebas a11y' })
    const counted = Math.max(0, Number(first.stock) - 1).toFixed(3)
    await call(t, 'PUT', `/inventory/stock-counts/${opened.id}/lines`, { lines: [{ ingredient_id: first.id, mode: 'base', quantity: counted, full_packages: '0' }] })
    closedCount = await call(t, 'POST', `/inventory/stock-counts/${opened.id}/close`)
  }
  ids.stockCount = closedCount.id

  // Un rol sin personas y una categoría vacía: solo esos se pueden eliminar.
  const roles = await call(t, 'GET', '/roles')
  if (!(roles.items ?? roles).some((r) => r.name === 'Caja (pruebas a11y)')) {
    await call(t, 'POST', '/roles', { name: 'Caja (pruebas a11y)', permissions: ['orders.read_all', 'cash.manage'] })
  }
  if (!menu.categories.some((c) => c.name === 'Postres (pruebas a11y)')) {
    await call(t, 'POST', '/menu/categories', { name: 'Postres (pruebas a11y)' })
  }

  const tp = await token('platform')
  // Un acceso fallido de una cuenta de plataforma deja un aviso (platform.login_failed) en el
  // registro de observabilidad: así la tabla de registros tiene una fila que abrir.
  const records = await call(tp, 'GET', '/platform/observability/logs')
  if (records.items.length === 0) {
    await call(null, 'POST', '/auth/login', { email: ACCOUNTS.platform.email, password: 'clave-equivocada-a11y' }).catch(() => undefined)
  }
  const restaurants = await call(tp, 'GET', '/platform/restaurants')
  ids.restaurant = (restaurants.items ?? restaurants)[0].id
  const sessions = await call(t, 'GET', '/cash/sessions')
  ids.shiftCashRegister = (sessions.items ?? sessions).find((s) => !s.is_open)?.id ?? null

  const tablesResponse = await call(t, 'GET', '/tables')
  ids.freeTable = tablesResponse.filter((m) => !m.active_order).at(-1)?.id ?? null

  await writeJson(join(REPORTS, 'datos.json'), ids)
  return ids
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(await prepareData())
}
