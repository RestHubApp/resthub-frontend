// La unica fuente de las rutas de la aplicacion.
//
// `routePatterns` guarda cada ruta una sola vez, tal como la entiende el
// router (`/pedidos/:orderId`). `paths` arma las direcciones concretas con
// constructores tipados: quien enlaza o navega llama a `paths.orders.detail(id)`
// y nunca escribe `/pedidos/…` a mano (lo comprueba ESLint). Las claves van en
// ingles; el valor es lo que ve el usuario en la barra de direcciones.

export const routePatterns = {
  home: '/',
  login: '/acceso',
  privacy: '/privacidad',
  profile: '/perfil',
  previewEntry: '/vista-previa',
  orders: '/pedidos',
  newOrder: '/pedidos/nuevo',
  orderDetail: '/pedidos/:orderId',
  addItems: '/pedidos/:orderId/agregar',
  print: '/imprimir/:orderId/:kind',
  board: '/tablero',
  history: '/tablero/historial',
  kitchen: '/cocina',
  reservations: '/reservas',
  customers: '/clientes',
  cash: '/caja',
  billing: '/comprobantes',
  invoicePrint: '/comprobantes/:invoiceId/imprimir',
  menu: '/menu',
  tables: '/mesas',
  inventory: '/inventario',
  recipeEditor: '/inventario/recetas/:menuItemId',
  staff: '/personal',
  roles: '/roles',
  insights: '/panel',
  restock: '/panel/reposicion',
  aiAudit: '/panel/ia',
  platform: '/plataforma',
  platformLogin: '/plataforma/acceso',
  newRestaurant: '/plataforma/restaurantes/nuevo',
  restaurantDetail: '/plataforma/restaurantes/:restaurantId',
  activity: '/plataforma/bitacora',
  platformPreview: '/plataforma/vista-previa',
  observability: '/plataforma/observabilidad',
} as const

type ParamsOf<P extends string> = P extends `${string}:${infer Name}/${infer Rest}`
  ? Name | ParamsOf<`/${Rest}`>
  : P extends `${string}:${infer Name}`
    ? Name
    : never

type PathValue = string | number

/** Rellena los `:parametros` de una ruta; falta uno y no compila. */
function fill<P extends string>(pattern: P, params: Record<ParamsOf<P>, PathValue>): string {
  return pattern.replaceAll(/:(\w+)/gu, (_match, name: string) =>
    encodeURIComponent(String((params as Record<string, PathValue>)[name])),
  )
}

/** Los tipos de impresion que acepta la ruta de impresion. */
export type PrintKind = 'comanda' | 'cuenta'

export const paths = {
  home: routePatterns.home,
  login: routePatterns.login,
  privacy: routePatterns.privacy,
  profile: routePatterns.profile,
  previewEntry: routePatterns.previewEntry,
  orders: {
    list: routePatterns.orders,
    takeaway: `${routePatterns.orders}?vista=llevar`,
    new: routePatterns.newOrder,
    newForTable: (tableId: PathValue) => `${routePatterns.newOrder}?mesa=${encodeURIComponent(String(tableId))}`,
    newWithQuery: (query: URLSearchParams) => `${routePatterns.newOrder}?${query.toString()}`,
    detail: (orderId: PathValue) => fill(routePatterns.orderDetail, { orderId }),
    addItems: (orderId: PathValue) => fill(routePatterns.addItems, { orderId }),
    print: (orderId: PathValue, kind: PrintKind) => fill(routePatterns.print, { orderId, kind }),
  },
  board: { list: routePatterns.board, history: routePatterns.history },
  kitchen: routePatterns.kitchen,
  reservations: routePatterns.reservations,
  customers: routePatterns.customers,
  cash: routePatterns.cash,
  billing: {
    list: routePatterns.billing,
    print: (invoiceId: PathValue) => fill(routePatterns.invoicePrint, { invoiceId }),
  },
  menu: routePatterns.menu,
  tables: routePatterns.tables,
  inventory: {
    list: routePatterns.inventory,
    recipes: `${routePatterns.inventory}?vista=recetas`,
    recipe: (menuItemId: PathValue) => fill(routePatterns.recipeEditor, { menuItemId }),
  },
  staff: routePatterns.staff,
  roles: routePatterns.roles,
  insights: {
    overview: routePatterns.insights,
    restock: routePatterns.restock,
    aiAudit: routePatterns.aiAudit,
  },
  platform: {
    home: routePatterns.platform,
    newRestaurant: routePatterns.newRestaurant,
    restaurant: (restaurantId: PathValue) => fill(routePatterns.restaurantDetail, { restaurantId }),
    activity: routePatterns.activity,
    preview: routePatterns.platformPreview,
    observability: routePatterns.observability,
  },
} as const
