// Deja en la base local los datos que hacen falta para abrir cada pantalla y
// cada modal con contenido: un cliente, una reserva, un proveedor con una
// orden de compra enviada, un pedido cobrado con su comprobante y un pedido
// listo para cobrar. Solo contra el backend local (API_URL); es idempotente:
// lo que ya existe no se vuelve a crear.
import { API_URL, CLAVE, CUENTAS, escribirJson, REPORTES } from './comun.mjs'
import { join } from 'node:path'

async function llamar(token, metodo, ruta, cuerpo) {
  const respuesta = await fetch(`${API_URL}/api/v1${ruta}`, {
    method: metodo,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  })
  const texto = await respuesta.text()
  const datos = texto ? JSON.parse(texto) : null
  if (!respuesta.ok) throw new Error(`${metodo} ${ruta} → ${respuesta.status} ${texto.slice(0, 300)}`)
  return datos
}

async function token(cuenta, plataforma = false) {
  const ruta = plataforma ? '/platform/auth/login' : '/auth/login'
  const r = await llamar(null, 'POST', ruta, { email: CUENTAS[cuenta].correo, password: CLAVE })
  return r.access_token
}

const hoyLima = () => new Date(Date.now() - 5 * 3600_000).toISOString().slice(0, 10)

export async function prepararDatos() {
  const t = await token('encargado')
  const ids = {}

  // Cliente y reserva.
  const clientes = await llamar(t, 'GET', '/customers')
  let cliente = clientes.items.find((c) => c.name === 'Lucía Quispe (pruebas a11y)')
  cliente ??= await llamar(t, 'POST', '/customers', {
    name: 'Lucía Quispe (pruebas a11y)', phone: '987654321', email: 'lucia@example.com',
    address: 'Av. Arequipa 123', reference: 'Frente al parque', notes: 'Cliente de las pruebas de accesibilidad',
  })
  ids.cliente = cliente.id
  const dia = hoyLima()
  const reservas = await llamar(t, 'GET', `/reservations?day=${dia}`)
  const lista = Array.isArray(reservas) ? reservas : reservas.items
  if (!lista.some((r) => r.customer_name === 'Lucía Quispe (pruebas a11y)')) {
    await llamar(t, 'POST', '/reservations', {
      customer_name: 'Lucía Quispe (pruebas a11y)', party_size: 4, reserved_for: `${dia}T20:00:00-05:00`,
      phone: '987654321', duration_minutes: 90, notes: 'Cumpleaños', customer_id: cliente.id,
    })
  }

  // Proveedor y orden de compra enviada (para «Recibir»).
  const proveedores = await llamar(t, 'GET', '/inventory/suppliers')
  let proveedor = proveedores.find((p) => p.name === 'Mercado Central (pruebas a11y)')
  proveedor ??= await llamar(t, 'POST', '/inventory/suppliers', {
    name: 'Mercado Central (pruebas a11y)', contact: 'Rosa', phone: '912345678', notes: '', is_active: true,
  })
  ids.proveedor = proveedor.id
  const ordenes = await llamar(t, 'GET', '/inventory/purchase-orders')
  if (ordenes.items.length === 0) {
    const insumos = await llamar(t, 'GET', '/inventory/ingredients')
    const lista2 = Array.isArray(insumos) ? insumos : insumos.items
    const orden = await llamar(t, 'POST', '/inventory/purchase-orders', {
      supplier_id: proveedor.id, notes: 'Orden de las pruebas de accesibilidad',
      lines: lista2.slice(0, 2).map((i) => ({ ingredient_id: i.id, quantity: '1000', unit_cost: '0.01' })),
    })
    await llamar(t, 'POST', `/inventory/purchase-orders/${orden.id}/send`)
    // Un borrador más, para ver los dos estados.
    await llamar(t, 'POST', '/inventory/purchase-orders', {
      supplier_id: proveedor.id, notes: 'Borrador', lines: [{ ingredient_id: lista2[2].id, quantity: '500', unit_cost: '0.02' }],
    })
  }

  // Datos fiscales, un pedido cobrado con comprobante y uno servido por cobrar.
  await llamar(t, 'PUT', '/billing/settings', {
    ruc: '20123456789', legal_name: 'Restaurante Demo S.A.C.', address: 'Jr. Lima 456, Lima',
    igv_rate: '18.00', boleta_series: 'B001', factura_series: 'F001', provider_url: '', provider_token: null,
  })
  const menu = await llamar(t, 'GET', '/menu')
  const platos = menu.categories.flatMap((c) => c.items ?? [])
  const plato = platos.find((p) => (p.modifier_groups ?? []).length === 0) ?? platos[0]
  // Un plato con opciones, para abrir el diálogo de opciones al tomar el pedido.
  const lomo = platos.find((p) => p.name === 'Lomo saltado') ?? platos.at(-1)
  if ((lomo.modifier_groups ?? []).length === 0) {
    await llamar(t, 'PATCH', `/menu/items/${lomo.id}`, {
      modifier_groups: [
        { name: 'Término de la carne', min_choices: 1, max_choices: 1, options: [{ name: 'Tres cuartos', price: '0' }, { name: 'Bien cocido', price: '0' }] },
        { name: 'Extras', min_choices: 0, max_choices: 2, options: [{ name: 'Huevo frito', price: '2.00' }, { name: 'Porción de arroz', price: '3.00' }] },
      ],
    })
    lomo.modifier_groups = [{}]
  }
  const facturas = await llamar(t, 'GET', '/billing/invoices')
  if (facturas.items.length === 0) {
    const pedido = await llamar(t, 'POST', '/orders', { type: 'takeaway', customer_name: 'Lucía Quispe', items: [{ menu_item_id: plato.id, quantity: 2 }] })
    for (const paso of ['send', 'ready', 'served']) await llamar(t, 'POST', `/orders/${pedido.id}/${paso}`).catch(() => undefined)
    const leido = await llamar(t, 'GET', `/orders/${pedido.id}`)
    await llamar(t, 'POST', `/orders/${pedido.id}/charge`, { payment_method: 'cash', amount_received: leido.balance ?? leido.total, tip: '0', expected_balance: leido.balance ?? leido.total })
    await llamar(t, 'POST', '/billing/invoices', { order_id: pedido.id, kind: 'boleta', customer_document_type: 'dni', customer_document_number: '12345678', customer_name: 'Lucía Quispe', customer_address: '' })
      .catch((e) => console.warn('comprobante:', e.message))
  }
  const facturas2 = await llamar(t, 'GET', '/billing/invoices')
  ids.comprobante = facturas2.items[0]?.id ?? null
  ids.pedidoCobrado = facturas2.items[0]?.order_id ?? null

  // Un pedido en mesa servido, del mesero, listo para cobrar (cobro y comprobante).
  const tm = await token('mesero')
  const activos = await llamar(tm, 'GET', '/orders/active')
  let porCobrar = activos.find((o) => o.notes === 'pruebas a11y')
  if (!porCobrar) {
    const mesas = await llamar(tm, 'GET', '/tables')
    const libre = mesas.find((m) => m.status === 'free' || !m.active_order)
    porCobrar = await llamar(tm, 'POST', '/orders', {
      type: 'dine_in', table_id: libre.id, notes: 'pruebas a11y',
      items: platos.filter((p) => p.id !== lomo.id).slice(0, 3).filter((p) => (p.modifier_groups ?? []).length === 0).map((p) => ({ menu_item_id: p.id, quantity: 1, notes: '' })),
    })
  }
  // El mesero envía; marcar listo y servido lo hace quien tiene la cocina (el encargado).
  if (porCobrar.status === 'open') await llamar(tm, 'POST', `/orders/${porCobrar.id}/send`)
  if (['open', 'in_kitchen'].includes(porCobrar.status)) await llamar(t, 'POST', `/orders/${porCobrar.id}/ready`)
  if (porCobrar.status !== 'served') await llamar(t, 'POST', `/orders/${porCobrar.id}/served`)
  ids.pedidoPorCobrar = porCobrar.id
  // Un pedido para llevar todavía sin enviar a cocina: sus platos se editan (notas).
  let abierto = activos.find((o) => o.customer_name === 'Sin enviar (pruebas a11y)' && o.status === 'open')
  abierto ??= await llamar(tm, 'POST', '/orders', {
    type: 'takeaway', customer_name: 'Sin enviar (pruebas a11y)',
    items: platos.filter((p) => p.id !== lomo.id).slice(0, 2).map((p) => ({ menu_item_id: p.id, quantity: 1, notes: '' })),
  })
  ids.pedidoAbierto = abierto.id
  ids.pedidoEnCocina = activos.find((o) => o.status === 'in_kitchen')?.id ?? porCobrar.id
  ids.plato = plato.id
  ids.platoConOpciones = platos.find((p) => (p.modifier_groups ?? []).length > 0)?.id ?? null

  // Un pedido cobrado sin comprobante (para «Emitir boleta o factura»).
  const cobrados = await llamar(t, 'GET', '/orders?status=paid').catch(() => ({ items: [] }))
  let sinComprobante = (cobrados.items ?? cobrados).find((o) => o.customer_name === 'Sin comprobante (pruebas a11y)')
  if (!sinComprobante) {
    const pedido = await llamar(t, 'POST', '/orders', { type: 'takeaway', customer_name: 'Sin comprobante (pruebas a11y)', items: [{ menu_item_id: plato.id, quantity: 1 }] })
    for (const paso of ['send', 'ready', 'served']) await llamar(t, 'POST', `/orders/${pedido.id}/${paso}`)
    const leido = await llamar(t, 'GET', `/orders/${pedido.id}`)
    await llamar(t, 'POST', `/orders/${pedido.id}/charge`, { payment_method: 'yape', tip: '0', expected_balance: leido.balance })
    sinComprobante = pedido
  }
  ids.pedidoSinComprobante = sinComprobante.id

  // Un rol sin personas y una categoría vacía: solo esos se pueden eliminar.
  const roles = await llamar(t, 'GET', '/roles')
  if (!(roles.items ?? roles).some((r) => r.name === 'Caja (pruebas a11y)')) {
    await llamar(t, 'POST', '/roles', { name: 'Caja (pruebas a11y)', permissions: ['orders.read_all', 'cash.manage'] })
  }
  if (!menu.categories.some((c) => c.name === 'Postres (pruebas a11y)')) {
    await llamar(t, 'POST', '/menu/categories', { name: 'Postres (pruebas a11y)' })
  }

  const tp = await token('plataforma', true)
  // Un acceso fallido a plataforma deja un aviso (platform.login_failed) en el
  // registro de observabilidad: así la tabla de registros tiene una fila que abrir.
  const registros = await llamar(tp, 'GET', '/platform/observability/logs')
  if (registros.items.length === 0) {
    await llamar(null, 'POST', '/platform/auth/login', { email: CUENTAS.plataforma.correo, password: 'clave-equivocada-a11y' }).catch(() => undefined)
  }
  const restaurantes = await llamar(tp, 'GET', '/platform/restaurants')
  ids.restaurante = (restaurantes.items ?? restaurantes)[0].id
  const sesiones = await llamar(t, 'GET', '/cash/sessions')
  ids.turnoCaja = (sesiones.items ?? sesiones).find((s) => !s.is_open)?.id ?? null

  const mesas = await llamar(t, 'GET', '/tables')
  ids.mesaLibre = mesas.filter((m) => !m.active_order).at(-1)?.id ?? null

  await escribirJson(join(REPORTES, 'datos.json'), ids)
  return ids
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(await prepararDatos())
}
