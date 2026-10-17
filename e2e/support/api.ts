// Cliente del API para preparar los datos de cada prueba.
//
// Cada prueba trabaja en un restaurante propio que da de alta la cuenta de
// plataforma de la semilla. Así las pruebas corren en paralelo y repetidas sin
// pisarse: la mesa ocupada, la caja abierta o el correlativo del día de una no
// cambian lo que ve la otra.
import { randomBytes } from 'node:crypto'

import { request, type APIRequestContext } from '@playwright/test'

import type {
  AccessTokenResponse,
  MenuCategory,
  MenuItem,
  OrderResponse,
  PlatformRestaurantDetail,
  PlatformSession,
  Role,
  StaffSession,
  TableResponse,
} from '../../src/api/types'

export const API_ORIGIN = process.env['E2E_API_URL'] ?? 'http://localhost:8201'
const API = `${API_ORIGIN}/api/v1`

/** La contraseña de la semilla y de las cuentas que crean las pruebas. */
export const SECRET = 'resthub123'
export const NEW_SECRET = 'resthub-e2e-12345'

export const SEED = {
  owner: 'admin@resthub.dev',
  waiter: 'mesero@resthub.dev',
  kitchen: 'cocina@resthub.dev',
  platform: 'plataforma@resthub.dev',
} as const

export interface Session {
  readonly email: string
  readonly password: string
  readonly name: string
  readonly token: string
  /** Lo que la aplicación guarda como cuenta (`sessionOf` de la respuesta de acceso). */
  readonly account: StaffSession
}

export interface SessionPlatform {
  readonly token: string
  /** Lo que la aplicación guarda como cuenta: la sesión discriminada de plataforma. */
  readonly account: PlatformSession
}

export interface Dish {
  readonly id: number
  readonly name: string
  readonly price: string
  readonly categoryId: number
}

export interface Table {
  readonly id: number
  readonly label: string
}

export interface Ingredient {
  readonly id: number
  readonly name: string
}

let counter = 0

/** Un sufijo que no se repite entre trabajadores, repeticiones ni corridas. */
export function unique(): string {
  counter += 1
  const random = randomBytes(3).toString('hex')
  return `${Date.now().toString(36)}${String(process.pid % 1000)}${String(counter)}${random}`
}

async function body<T>(response: Awaited<ReturnType<APIRequestContext['get']>>, that: string): Promise<T> {
  if (!response.ok()) {
    throw new Error(`${that}: ${String(response.status())} ${await response.text()}`)
  }
  const text = await response.text()
  return JSON.parse(text === '' ? '{}' : text) as T
}

/** Un cliente con el token de una cuenta. */
export class Customer {
  private readonly http: APIRequestContext
  private readonly token: string

  constructor(http: APIRequestContext, token: string) {
    this.http = http
    this.token = token
  }

  private headers() {
    return { Authorization: `Bearer ${this.token}`, Connection: 'close' }
  }

  async get<T>(route: string): Promise<T> {
    return body<T>(await this.http.get(`${API}${route}`, { headers: this.headers() }), `GET ${route}`)
  }

  async list<T>(route: string): Promise<T[]> {
    const data = await this.get<T[] | { items?: T[] }>(route)
    return Array.isArray(data) ? data : (data.items ?? [])
  }

  async post<T>(route: string, data: unknown = {}): Promise<T> {
    return body<T>(await this.http.post(`${API}${route}`, { headers: this.headers(), data }), `POST ${route}`)
  }

  async put<T>(route: string, data: unknown): Promise<T> {
    return body<T>(await this.http.put(`${API}${route}`, { headers: this.headers(), data }), `PUT ${route}`)
  }

  async patch<T>(route: string, data: unknown): Promise<T> {
    return body<T>(await this.http.patch(`${API}${route}`, { headers: this.headers(), data }), `PATCH ${route}`)
  }
}

// Sin reusar conexiones: uvicorn cierra una conexión inactiva a los 5 s y una
// prueba que pasa más tiempo en la pantalla caía en ese cierre («socket hang up»).
export async function newHttp(): Promise<APIRequestContext> {
  return request.newContext({ extraHTTPHeaders: { Connection: 'close' } })
}

export async function signInByApi(http: APIRequestContext, email: string, password = SECRET): Promise<Session> {
  const access = await body<AccessTokenResponse>(
    await http.post(`${API}/auth/login`, { data: { email, password } }),
    `acceso de ${email}`,
  )
  if (access.kind !== 'staff') {
    throw new Error(`${email} no es una cuenta del personal.`)
  }
  const token = access.access_token
  // Como la persona al entrar por primera vez: acepta los términos vigentes
  // (Ley N.º 29733). Su pantalla tiene sus propias pruebas; las demás entran
  // con la cuenta ya al día.
  const data = access.terms_accepted && access.privacy_accepted ? access : await body<StaffSession>(
    await http.post(`${API}/auth/me/terms`, {
      data: { terms_version: access.terms_version, privacy_version: access.privacy_version },
      headers: { Authorization: `Bearer ${token}` },
    }),
    `términos de ${email}`,
  )
  const { user, restaurant, permissions, preview, terms_version, terms_accepted, privacy_version, privacy_accepted } = data
  const { must_change_password, idle_lock_minutes, has_pin, session_locked } = data
  return {
    email,
    password,
    name: user.full_name,
    token,
    account: {
      kind: 'staff', user, restaurant, permissions, preview, terms_version, terms_accepted, privacy_version, privacy_accepted,
      must_change_password, idle_lock_minutes, has_pin, session_locked,
    },
  }
}

export async function signInPlatformByApi(http: APIRequestContext): Promise<SessionPlatform> {
  const data = await body<AccessTokenResponse>(
    await http.post(`${API}/auth/login`, { data: { email: SEED.platform, password: SECRET } }),
    'acceso de plataforma',
  )
  if (data.kind !== 'platform') {
    throw new Error('La cuenta de plataforma de la semilla no entró como plataforma.')
  }
  const { admin, permissions, preview } = data
  return { token: data.access_token, account: { kind: 'platform', admin, permissions, preview } }
}

/** La carta mínima de cada restaurante de prueba. Los precios incluyen IGV. */
export const MENU = {
  funds: [
    { name: 'Lomo saltado', price: '32.00' },
    { name: 'Ají de gallina', price: '24.00' },
    { name: 'Ceviche clásico', price: '28.00' },
  ],
  drinks: [
    { name: 'Chicha morada', price: '8.00' },
    { name: 'Inca Kola 500 ml', price: '6.00' },
  ],
} as const

export const TABLES = ['1', '2', '3', '4'] as const

export interface Local {
  readonly id: number
  readonly slug: string
  readonly name: string
  readonly owner: Session
  readonly waiter: Session
  readonly kitchen: Session
  readonly dishes: readonly Dish[]
  readonly tables: readonly Table[]
  readonly ingredients: readonly Ingredient[]
  /** Cliente del API como encargado, para preparar o comprobar datos. */
  readonly api: Customer
  readonly http: APIRequestContext
  readonly dish: (name: string) => Dish
  readonly table: (label: string) => Table
}

async function createMenu(api: Customer): Promise<Dish[]> {
  const dishes: Dish[] = []
  for (const [category, list] of [
    ['Fondos', MENU.funds],
    ['Bebidas', MENU.drinks],
  ] as const) {
    const cat = await api.post<MenuCategory>('/menu/categories', { name: category })
    for (const dish of list) {
      const created = await api.post<MenuItem>('/menu/items', { category_id: cat.id, name: dish.name, price: dish.price })
      dishes.push({ id: created.id, name: dish.name, price: dish.price, categoryId: cat.id })
    }
  }
  return dishes
}

async function createIngredients(api: Customer, lomo: Dish): Promise<Ingredient[]> {
  const data = [
    { name: 'Lomo de res', unit: 'g', min_stock: '1000', unit_cost: '0.042', purchase: '5000' },
    { name: 'Cebolla roja', unit: 'g', min_stock: '500', unit_cost: '0.003', purchase: '3000' },
    { name: 'Culantro', unit: 'g', min_stock: '200', unit_cost: '0.012', purchase: '100' },
  ]
  const ingredients: Ingredient[] = []
  for (const { purchase, ...ingredient } of data) {
    const created = await api.post<Ingredient>('/inventory/ingredients', ingredient)
    await api.post('/inventory/purchases', {
      ingredient_id: created.id,
      quantity: purchase,
      unit_cost: ingredient.unit_cost,
      reason: 'Stock inicial',
    })
    ingredients.push({ id: created.id, name: ingredient.name })
  }
  const [lomoRes, cebolla] = ingredients
  if (lomoRes === undefined || cebolla === undefined) {
    throw new Error('Faltan los insumos de la receta')
  }
  await api.put(`/inventory/recipes/${String(lomo.id)}`, {
    lines: [
      { ingredient_id: lomoRes.id, quantity: '200' },
      { ingredient_id: cebolla.id, quantity: '80' },
    ],
  })
  return ingredients
}

async function createStaff(http: APIRequestContext, api: Customer, suffix: string) {
  const roles = await api.list<Role>('/roles')
  const roleWaiter = roles.find((role) => role.kind === 'waiter')
  const cook = await api.post<Role>('/roles', {
    name: 'Cocinero',
    permissions: ['menu.read', 'orders.read_all', 'orders.manage', 'inventory.read'],
  })
  const accounts = {
    waiter: { email: `mesero-${suffix}@e2e.resthub.dev`, full_name: 'Mesero Prueba', role_id: roleWaiter?.id },
    kitchen: { email: `cocina-${suffix}@e2e.resthub.dev`, full_name: 'Cocina Prueba', role_id: cook.id },
  }
  for (const account of Object.values(accounts)) {
    await api.post('/staff', { ...account, password: NEW_SECRET })
  }
  return {
    waiter: await signInByApi(http, accounts.waiter.email, NEW_SECRET),
    kitchen: await signInByApi(http, accounts.kitchen.email, NEW_SECRET),
  }
}

export interface OptionsRestaurant {
  /** Abre la caja con S/ 100 para poder cobrar. */
  readonly openCashRegister?: boolean
  readonly name?: string
}

/** Da de alta un restaurante con su personal, su carta, sus mesas y un poco de inventario. */
export async function createRestaurant(options: OptionsRestaurant = {}): Promise<Local> {
  const http = await newHttp()
  const platform = await signInPlatformByApi(http)
  const suffix = unique()
  const slug = `e2e-${suffix}`
  const name = options.name ?? 'Restaurante E2E'
  const emailOwner = `encargado-${suffix}@e2e.resthub.dev`
  const registration = await new Customer(http, platform.token).post<PlatformRestaurantDetail>('/platform/restaurants', {
    name,
    slug,
    timezone: 'America/Lima',
    owner: { full_name: 'Encargada Prueba', email: emailOwner, password: NEW_SECRET },
  })
  const owner = await signInByApi(http, emailOwner, NEW_SECRET)
  const api = new Customer(http, owner.token)
  const dishes = await createMenu(api)
  const tables: Table[] = []
  for (const label of TABLES) {
    const table = await api.post<TableResponse>('/tables', { label })
    tables.push({ id: table.id, label })
  }
  const lomo = dishes[0]
  if (lomo === undefined) {
    throw new Error('La carta de prueba está vacía')
  }
  const ingredients = await createIngredients(api, lomo)
  const { waiter, kitchen } = await createStaff(http, api, suffix)
  if (options.openCashRegister === true) {
    await api.post('/cash/open', { opening_amount: '100.00', notes: '' })
  }
  return {
    id: registration.id,
    slug,
    name,
    owner,
    waiter,
    kitchen,
    dishes,
    tables,
    ingredients,
    api,
    http,
    dish(nameDish) {
      const found = dishes.find((p) => p.name === nameDish)
      if (found === undefined) {
        throw new Error(`No hay plato ${nameDish}`)
      }
      return found
    },
    table(label) {
      const found = tables.find((m) => m.label === label)
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
  items: readonly { dish: Dish; quantity?: number; notes?: string }[],
  who: Session = local.waiter,
): Promise<OrderResponse> {
  const api = new Customer(local.http, who.token)
  const order = await api.post<OrderResponse>('/orders', {
    type: 'dine_in',
    table_id: table.id,
    client_request_id: `e2e-${unique()}`,
    items: items.map(({ dish, quantity = 1, notes = '' }) => ({ menu_item_id: dish.id, quantity, notes })),
  })
  return api.post<OrderResponse>(`/orders/${String(order.id)}/send`)
}

/** Lleva un pedido hasta «servido»: la cocina lo marca listo y el mesero lo sirve. */
export async function serve(local: Local, orderId: number): Promise<OrderResponse> {
  await new Customer(local.http, local.kitchen.token).post(`/orders/${String(orderId)}/ready`)
  return new Customer(local.http, local.waiter.token).post<OrderResponse>(`/orders/${String(orderId)}/served`)
}
