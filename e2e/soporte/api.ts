// Cliente del API para preparar los datos de cada prueba.
//
// Cada prueba trabaja en un restaurante propio que da de alta la cuenta de
// plataforma de la semilla. Así las pruebas corren en paralelo y repetidas sin
// pisarse: la mesa ocupada, la caja abierta o el correlativo del día de una no
// cambian lo que ve la otra.
import { randomBytes } from 'node:crypto'

import { request, type APIRequestContext } from '@playwright/test'

export const API_ORIGIN = process.env.E2E_API_URL ?? 'http://localhost:8201'
const API = `${API_ORIGIN}/api/v1`

/** La contraseña de la semilla y de las cuentas que crean las pruebas. */
export const CLAVE = 'resthub123'
export const CLAVE_NUEVA = 'resthub-e2e-12345'

export const SEMILLA = {
  encargado: 'admin@resthub.dev',
  mesero: 'mesero@resthub.dev',
  cocina: 'cocina@resthub.dev',
  plataforma: 'plataforma@resthub.dev',
} as const

type Json = Record<string, unknown>

export interface Sesion {
  readonly email: string
  readonly password: string
  readonly nombre: string
  readonly token: string
  /** Lo que la aplicación guarda como cuenta (`sessionOf` de la respuesta de acceso). */
  readonly cuenta: Json
}

export interface SesionPlataforma {
  readonly token: string
  readonly admin: Json
}

export interface Plato {
  readonly id: number
  readonly nombre: string
  readonly precio: string
  readonly categoriaId: number
}

export interface Mesa {
  readonly id: number
  readonly etiqueta: string
}

export interface Insumo {
  readonly id: number
  readonly nombre: string
}

let contador = 0

/** Un sufijo que no se repite entre trabajadores, repeticiones ni corridas. */
export function unico(): string {
  contador += 1
  const aleatorio = randomBytes(3).toString('hex')
  return `${Date.now().toString(36)}${String(process.pid % 1000)}${String(contador)}${aleatorio}`
}

async function cuerpo(respuesta: Awaited<ReturnType<APIRequestContext['get']>>, que: string): Promise<Json> {
  if (!respuesta.ok()) {
    throw new Error(`${que}: ${String(respuesta.status())} ${await respuesta.text()}`)
  }
  const texto = await respuesta.text()
  return texto === '' ? {} : (JSON.parse(texto) as Json)
}

/** Un cliente con el token de una cuenta. */
export class Cliente {
  private readonly http: APIRequestContext
  private readonly token: string

  constructor(http: APIRequestContext, token: string) {
    this.http = http
    this.token = token
  }

  private cabeceras() {
    return { Authorization: `Bearer ${this.token}` }
  }

  async get(ruta: string): Promise<Json> {
    return cuerpo(await this.http.get(`${API}${ruta}`, { headers: this.cabeceras() }), `GET ${ruta}`)
  }

  async lista(ruta: string): Promise<Json[]> {
    const datos = (await this.get(ruta)) as unknown
    if (Array.isArray(datos)) {
      return datos as Json[]
    }
    return ((datos as Json).items ?? []) as Json[]
  }

  async post(ruta: string, data: unknown = {}): Promise<Json> {
    return cuerpo(await this.http.post(`${API}${ruta}`, { headers: this.cabeceras(), data }), `POST ${ruta}`)
  }

  async put(ruta: string, data: unknown): Promise<Json> {
    return cuerpo(await this.http.put(`${API}${ruta}`, { headers: this.cabeceras(), data }), `PUT ${ruta}`)
  }

  async patch(ruta: string, data: unknown): Promise<Json> {
    return cuerpo(await this.http.patch(`${API}${ruta}`, { headers: this.cabeceras(), data }), `PATCH ${ruta}`)
  }
}

export async function nuevoHttp(): Promise<APIRequestContext> {
  return request.newContext()
}

export async function entrarPorApi(http: APIRequestContext, email: string, password = CLAVE): Promise<Sesion> {
  const datos = await cuerpo(
    await http.post(`${API}/auth/login`, { data: { email, password } }),
    `acceso de ${email}`,
  )
  const { user, restaurant, permissions, preview } = datos
  return {
    email,
    password,
    nombre: String((user as Json).full_name),
    token: String(datos.access_token),
    cuenta: { user, restaurant, permissions, preview },
  }
}

export async function entrarPlataformaPorApi(http: APIRequestContext): Promise<SesionPlataforma> {
  const datos = await cuerpo(
    await http.post(`${API}/platform/auth/login`, { data: { email: SEMILLA.plataforma, password: CLAVE } }),
    'acceso de plataforma',
  )
  return { token: String(datos.access_token), admin: datos.admin as Json }
}

/** La carta mínima de cada restaurante de prueba. Los precios incluyen IGV. */
export const CARTA = {
  fondos: [
    { nombre: 'Lomo saltado', precio: '32.00' },
    { nombre: 'Ají de gallina', precio: '24.00' },
    { nombre: 'Ceviche clásico', precio: '28.00' },
  ],
  bebidas: [
    { nombre: 'Chicha morada', precio: '8.00' },
    { nombre: 'Inca Kola 500 ml', precio: '6.00' },
  ],
} as const

export const MESAS = ['1', '2', '3', '4'] as const

export interface Local {
  readonly id: number
  readonly slug: string
  readonly nombre: string
  readonly encargado: Sesion
  readonly mesero: Sesion
  readonly cocina: Sesion
  readonly platos: readonly Plato[]
  readonly mesas: readonly Mesa[]
  readonly insumos: readonly Insumo[]
  /** Cliente del API como encargado, para preparar o comprobar datos. */
  readonly api: Cliente
  readonly http: APIRequestContext
  plato(nombre: string): Plato
  mesa(etiqueta: string): Mesa
}

async function crearCarta(api: Cliente): Promise<Plato[]> {
  const platos: Plato[] = []
  for (const [categoria, lista] of [
    ['Fondos', CARTA.fondos],
    ['Bebidas', CARTA.bebidas],
  ] as const) {
    const cat = await api.post('/menu/categories', { name: categoria })
    for (const plato of lista) {
      const creado = await api.post('/menu/items', { category_id: cat.id, name: plato.nombre, price: plato.precio })
      platos.push({ id: Number(creado.id), nombre: plato.nombre, precio: plato.precio, categoriaId: Number(cat.id) })
    }
  }
  return platos
}

async function crearInsumos(api: Cliente, lomo: Plato): Promise<Insumo[]> {
  const datos = [
    { name: 'Lomo de res', unit: 'g', min_stock: '1000', unit_cost: '0.042', compra: '5000' },
    { name: 'Cebolla roja', unit: 'g', min_stock: '500', unit_cost: '0.003', compra: '3000' },
    { name: 'Culantro', unit: 'g', min_stock: '200', unit_cost: '0.012', compra: '100' },
  ]
  const insumos: Insumo[] = []
  for (const { compra, ...insumo } of datos) {
    const creado = await api.post('/inventory/ingredients', insumo)
    await api.post('/inventory/purchases', {
      ingredient_id: creado.id,
      quantity: compra,
      unit_cost: insumo.unit_cost,
      reason: 'Stock inicial',
    })
    insumos.push({ id: Number(creado.id), nombre: insumo.name })
  }
  const [lomoRes, cebolla] = insumos
  await api.put(`/inventory/recipes/${String(lomo.id)}`, {
    lines: [
      { ingredient_id: lomoRes.id, quantity: '200' },
      { ingredient_id: cebolla.id, quantity: '80' },
    ],
  })
  return insumos
}

async function crearPersonal(http: APIRequestContext, api: Cliente, sufijo: string) {
  const roles = await api.lista('/roles')
  const rolMesero = roles.find((rol) => rol.kind === 'waiter')
  const cocinero = await api.post('/roles', {
    name: 'Cocinero',
    permissions: ['menu.read', 'orders.read_all', 'orders.manage', 'inventory.read'],
  })
  const cuentas = {
    mesero: { email: `mesero-${sufijo}@e2e.resthub.dev`, full_name: 'Mesero Prueba', role_id: rolMesero?.id },
    cocina: { email: `cocina-${sufijo}@e2e.resthub.dev`, full_name: 'Cocina Prueba', role_id: cocinero.id },
  }
  for (const cuenta of Object.values(cuentas)) {
    await api.post('/staff', { ...cuenta, password: CLAVE_NUEVA })
  }
  return {
    mesero: await entrarPorApi(http, cuentas.mesero.email, CLAVE_NUEVA),
    cocina: await entrarPorApi(http, cuentas.cocina.email, CLAVE_NUEVA),
  }
}

export interface OpcionesLocal {
  /** Abre la caja con S/ 100 para poder cobrar. */
  readonly cajaAbierta?: boolean
  readonly nombre?: string
}

/** Da de alta un restaurante con su personal, su carta, sus mesas y un poco de inventario. */
export async function crearLocal(opciones: OpcionesLocal = {}): Promise<Local> {
  const http = await nuevoHttp()
  const plataforma = await entrarPlataformaPorApi(http)
  const sufijo = unico()
  const slug = `e2e-${sufijo}`
  const nombre = opciones.nombre ?? 'Restaurante E2E'
  const correoEncargado = `encargado-${sufijo}@e2e.resthub.dev`
  const alta = await new Cliente(http, plataforma.token).post('/platform/restaurants', {
    name: nombre,
    slug,
    timezone: 'America/Lima',
    owner: { full_name: 'Encargada Prueba', email: correoEncargado, password: CLAVE_NUEVA },
  })
  const encargado = await entrarPorApi(http, correoEncargado, CLAVE_NUEVA)
  const api = new Cliente(http, encargado.token)
  const platos = await crearCarta(api)
  const mesas: Mesa[] = []
  for (const etiqueta of MESAS) {
    const mesa = await api.post('/tables', { label: etiqueta })
    mesas.push({ id: Number(mesa.id), etiqueta })
  }
  const insumos = await crearInsumos(api, platos[0])
  const { mesero, cocina } = await crearPersonal(http, api, sufijo)
  if (opciones.cajaAbierta === true) {
    await api.post('/cash/open', { opening_amount: '100.00', notes: '' })
  }
  return {
    id: Number(alta.id),
    slug,
    nombre,
    encargado,
    mesero,
    cocina,
    platos,
    mesas,
    insumos,
    api,
    http,
    plato(nombrePlato) {
      const encontrado = platos.find((p) => p.nombre === nombrePlato)
      if (encontrado === undefined) {
        throw new Error(`No hay plato ${nombrePlato}`)
      }
      return encontrado
    },
    mesa(etiqueta) {
      const encontrada = mesas.find((m) => m.etiqueta === etiqueta)
      if (encontrada === undefined) {
        throw new Error(`No hay mesa ${etiqueta}`)
      }
      return encontrada
    },
  }
}

/** Abre un pedido en mesa y lo manda a cocina, como el celular del mesero. */
export async function pedidoEnMesa(
  local: Local,
  mesa: Mesa,
  items: readonly { plato: Plato; cantidad?: number; notas?: string }[],
  quien: Sesion = local.mesero,
): Promise<Json> {
  const api = new Cliente(local.http, quien.token)
  const pedido = await api.post('/orders', {
    type: 'dine_in',
    table_id: mesa.id,
    client_request_id: `e2e-${unico()}`,
    items: items.map(({ plato, cantidad = 1, notas = '' }) => ({ menu_item_id: plato.id, quantity: cantidad, notes: notas })),
  })
  return api.post(`/orders/${String(pedido.id)}/send`)
}

/** Lleva un pedido hasta «servido»: la cocina lo marca listo y el mesero lo sirve. */
export async function servir(local: Local, pedidoId: number): Promise<Json> {
  await new Cliente(local.http, local.cocina.token).post(`/orders/${String(pedidoId)}/ready`)
  return new Cliente(local.http, local.mesero.token).post(`/orders/${String(pedidoId)}/served`)
}
