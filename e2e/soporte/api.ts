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
export const SECRET = 'resthub123'
export const NEW_SECRET = 'resthub-e2e-12345'

export const SEED = {
  encargado: 'admin@resthub.dev',
  mesero: 'mesero@resthub.dev',
  cocina: 'cocina@resthub.dev',
  plataforma: 'plataforma@resthub.dev',
} as const

type Json = Record<string, unknown>

export interface Session {
  readonly email: string
  readonly password: string
  readonly nombre: string
  readonly token: string
  /** Lo que la aplicación guarda como cuenta (`sessionOf` de la respuesta de acceso). */
  readonly cuenta: Json
}

export interface SessionPlatform {
  readonly token: string
  readonly admin: Json
}

export interface Dish {
  readonly id: number
  readonly nombre: string
  readonly precio: string
  readonly categoriaId: number
}

export interface Table {
  readonly id: number
  readonly etiqueta: string
}

export interface Ingredient {
  readonly id: number
  readonly nombre: string
}

let counter = 0

/** Un sufijo que no se repite entre trabajadores, repeticiones ni corridas. */
export function unique(): string {
  counter += 1
  const random = randomBytes(3).toString('hex')
  return `${Date.now().toString(36)}${String(process.pid % 1000)}${String(counter)}${random}`
}

async function body(response: Awaited<ReturnType<APIRequestContext['get']>>, that: string): Promise<Json> {
  if (!response.ok()) {
    throw new Error(`${that}: ${String(response.status())} ${await response.text()}`)
  }
  const text = await response.text()
  return text === '' ? {} : (JSON.parse(text) as Json)
}

/** Un cliente con el token de una cuenta. */
export class Customer {
  private readonly http: APIRequestContext
  private readonly token: string

  constructor(http: APIRequestContext, token: string) {
    this.http = http
    this.token = token
  }

  private cabeceras() {
    return { Authorization: `Bearer ${this.token}`, Connection: 'close' }
  }

  async get(route: string): Promise<Json> {
    return body(await this.http.get(`${API}${route}`, { headers: this.cabeceras() }), `GET ${route}`)
  }

  async lista(route: string): Promise<Json[]> {
    const data = (await this.get(route)) as unknown
    if (Array.isArray(data)) {
      return data as Json[]
    }
    return ((data as Json).items ?? []) as Json[]
  }

  async post(route: string, data: unknown = {}): Promise<Json> {
    return body(await this.http.post(`${API}${route}`, { headers: this.cabeceras(), data }), `POST ${route}`)
  }

  async put(route: string, data: unknown): Promise<Json> {
    return body(await this.http.put(`${API}${route}`, { headers: this.cabeceras(), data }), `PUT ${route}`)
  }

  async patch(route: string, data: unknown): Promise<Json> {
    return body(await this.http.patch(`${API}${route}`, { headers: this.cabeceras(), data }), `PATCH ${route}`)
  }
}

// Sin reusar conexiones: uvicorn cierra una conexión inactiva a los 5 s y una
// prueba que pasa más tiempo en la pantalla caía en ese cierre («socket hang up»).
export async function newHttp(): Promise<APIRequestContext> {
  return request.newContext({ extraHTTPHeaders: { Connection: 'close' } })
}

export async function signInByApi(http: APIRequestContext, email: string, password = SECRET): Promise<Session> {
  const access = await body(
    await http.post(`${API}/auth/login`, { data: { email, password } }),
    `acceso de ${email}`,
  )
  const token = String(access.access_token)
  // Como la persona al entrar por primera vez: acepta los términos vigentes
  // (Ley N.º 29733). Su pantalla tiene sus propias pruebas; las demás entran
  // con la cuenta ya al día.
  const data = access.terms_accepted === true ? access : await body(
    await http.post(`${API}/auth/me/terms`, {
      data: { version: access.terms_version },
      headers: { Authorization: `Bearer ${token}` },
    }),
    `términos de ${email}`,
  )
  const { user, restaurant, permissions, preview, terms_version, terms_accepted } = data
  return {
    email,
    password,
    nombre: String((user as Json).full_name),
    token,
    cuenta: { user, restaurant, permissions, preview, terms_version, terms_accepted },
  }
}

export async function signInPlatformByApi(http: APIRequestContext): Promise<SessionPlatform> {
  const data = await body(
    await http.post(`${API}/platform/auth/login`, { data: { email: SEED.plataforma, password: SECRET } }),
    'acceso de plataforma',
  )
  return { token: String(data.access_token), admin: data.admin as Json }
}

/** La carta mínima de cada restaurante de prueba. Los precios incluyen IGV. */
export const MENU = {
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

export const TABLES = ['1', '2', '3', '4'] as const

export interface Local {
  readonly id: number
  readonly slug: string
  readonly nombre: string
  readonly encargado: Session
  readonly mesero: Session
  readonly cocina: Session
  readonly platos: readonly Dish[]
  readonly mesas: readonly Table[]
  readonly insumos: readonly Ingredient[]
  /** Cliente del API como encargado, para preparar o comprobar datos. */
  readonly api: Customer
  readonly http: APIRequestContext
  readonly plato: (name: string) => Dish
  readonly mesa: (label: string) => Table
}

async function createMenu(api: Customer): Promise<Dish[]> {
  const dishes: Dish[] = []
  for (const [category, list] of [
    ['Fondos', MENU.fondos],
    ['Bebidas', MENU.bebidas],
  ] as const) {
    const cat = await api.post('/menu/categories', { name: category })
    for (const dish of list) {
      const created = await api.post('/menu/items', { category_id: cat.id, name: dish.nombre, price: dish.precio })
      dishes.push({ id: Number(created.id), nombre: dish.nombre, precio: dish.precio, categoriaId: Number(cat.id) })
    }
  }
  return dishes
}

async function createIngredients(api: Customer, lomo: Dish): Promise<Ingredient[]> {
  const data = [
    { name: 'Lomo de res', unit: 'g', min_stock: '1000', unit_cost: '0.042', compra: '5000' },
    { name: 'Cebolla roja', unit: 'g', min_stock: '500', unit_cost: '0.003', compra: '3000' },
    { name: 'Culantro', unit: 'g', min_stock: '200', unit_cost: '0.012', compra: '100' },
  ]
  const ingredients: Ingredient[] = []
  for (const { compra: purchase, ...ingredient } of data) {
    const created = await api.post('/inventory/ingredients', ingredient)
    await api.post('/inventory/purchases', {
      ingredient_id: created.id,
      quantity: purchase,
      unit_cost: ingredient.unit_cost,
      reason: 'Stock inicial',
    })
    ingredients.push({ id: Number(created.id), nombre: ingredient.name })
  }
  const [lomoRes, cebolla] = ingredients
  await api.put(`/inventory/recipes/${String(lomo.id)}`, {
    lines: [
      { ingredient_id: lomoRes.id, quantity: '200' },
      { ingredient_id: cebolla.id, quantity: '80' },
    ],
  })
  return ingredients
}

async function createStaff(http: APIRequestContext, api: Customer, suffix: string) {
  const roles = await api.lista('/roles')
  const roleWaiter = roles.find((role) => role.kind === 'waiter')
  const cook = await api.post('/roles', {
    name: 'Cocinero',
    permissions: ['menu.read', 'orders.read_all', 'orders.manage', 'inventory.read'],
  })
  const accounts = {
    mesero: { email: `mesero-${suffix}@e2e.resthub.dev`, full_name: 'Mesero Prueba', role_id: roleWaiter?.id },
    cocina: { email: `cocina-${suffix}@e2e.resthub.dev`, full_name: 'Cocina Prueba', role_id: cook.id },
  }
  for (const account of Object.values(accounts)) {
    await api.post('/staff', { ...account, password: NEW_SECRET })
  }
  return {
    mesero: await signInByApi(http, accounts.mesero.email, NEW_SECRET),
    cocina: await signInByApi(http, accounts.cocina.email, NEW_SECRET),
  }
}

export interface OptionsRestaurant {
  /** Abre la caja con S/ 100 para poder cobrar. */
  readonly cajaAbierta?: boolean
  readonly nombre?: string
}

/** Da de alta un restaurante con su personal, su carta, sus mesas y un poco de inventario. */
export async function createRestaurant(options: OptionsRestaurant = {}): Promise<Local> {
  const http = await newHttp()
  const platform = await signInPlatformByApi(http)
  const suffix = unique()
  const slug = `e2e-${suffix}`
  const name = options.nombre ?? 'Restaurante E2E'
  const emailOwner = `encargado-${suffix}@e2e.resthub.dev`
  const registration = await new Customer(http, platform.token).post('/platform/restaurants', {
    name: name,
    slug,
    timezone: 'America/Lima',
    owner: { full_name: 'Encargada Prueba', email: emailOwner, password: NEW_SECRET },
  })
  const owner = await signInByApi(http, emailOwner, NEW_SECRET)
  const api = new Customer(http, owner.token)
  const dishes = await createMenu(api)
  const tables: Table[] = []
  for (const label of TABLES) {
    const table = await api.post('/tables', { label: label })
    tables.push({ id: Number(table.id), etiqueta: label })
  }
  const ingredients = await createIngredients(api, dishes[0])
  const { mesero: waiter, cocina: kitchen } = await createStaff(http, api, suffix)
  if (options.cajaAbierta === true) {
    await api.post('/cash/open', { opening_amount: '100.00', notes: '' })
  }
  return {
    id: Number(registration.id),
    slug,
    nombre: name,
    encargado: owner,
    mesero: waiter,
    cocina: kitchen,
    platos: dishes,
    mesas: tables,
    insumos: ingredients,
    api,
    http,
    plato(nameDish) {
      const found = dishes.find((p) => p.nombre === nameDish)
      if (found === undefined) {
        throw new Error(`No hay plato ${nameDish}`)
      }
      return found
    },
    mesa(label) {
      const found = tables.find((m) => m.etiqueta === label)
      if (found === undefined) {
        throw new Error(`No hay mesa ${label}`)
      }
      return found
    },
  }
}

/** Abre un pedido en mesa y lo manda a cocina, como el celular del mesero. */
export async function orderInTable(
  local: Local,
  table: Table,
  items: readonly { plato: Dish; cantidad?: number; notas?: string }[],
  who: Session = local.mesero,
): Promise<Json> {
  const api = new Customer(local.http, who.token)
  const order = await api.post('/orders', {
    type: 'dine_in',
    table_id: table.id,
    client_request_id: `e2e-${unique()}`,
    items: items.map(({ plato: dish, cantidad: quantity = 1, notas: notes = '' }) => ({ menu_item_id: dish.id, quantity: quantity, notes: notes })),
  })
  return api.post(`/orders/${String(order.id)}/send`)
}

/** Lleva un pedido hasta «servido»: la cocina lo marca listo y el mesero lo sirve. */
export async function serve(local: Local, orderId: number): Promise<Json> {
  await new Customer(local.http, local.cocina.token).post(`/orders/${String(orderId)}/ready`)
  return new Customer(local.http, local.mesero.token).post(`/orders/${String(orderId)}/served`)
}
