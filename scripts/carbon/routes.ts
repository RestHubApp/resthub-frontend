/** Una pantalla cuya primera visita se mide. */
export interface Route {
  readonly name: string
  readonly path: string
  /** `waiter`: se entra con la sesión de un mesero; `none`: sin sesión. */
  readonly session: 'none' | 'waiter'
  /**
   * Los módulos (`src` del manifest de Vite) que la ruta descarga al abrirse,
   * además del archivo inicial. Es lo único que el modo estático no puede
   * deducir solo: se comprueba contra el manifest y falla si dejó de existir.
   */
  readonly lazy: readonly string[]
}

/**
 * Las pantallas con `offline: true` en el registro del router: el mesero las
 * necesita sin señal y se bajan una vez, ya con sesión (`useOfflineWarmup`).
 */
export const OFFLINE_SCREENS: readonly string[] = [
  'src/features/orders/OrdersView.tsx',
  'src/features/orders/NewOrderView.tsx',
  'src/features/orders/OrderDetailView.tsx',
  'src/features/orders/AddItemsView.tsx',
]

/** Las rutas públicas y la pantalla principal de quien entra: el mesero, en Pedidos. */
export const ROUTES: readonly Route[] = [
  { name: 'Acceso', path: '/acceso', session: 'none', lazy: ['src/features/auth/LoginView.tsx'] },
  { name: 'Privacidad', path: '/privacidad', session: 'none', lazy: ['src/features/legal/PrivacyView.tsx'] },
  {
    name: 'Acceso de plataforma',
    path: '/plataforma/acceso',
    session: 'none',
    lazy: ['src/features/platform/PlatformShell.tsx', 'src/features/platform/PlatformLoginView.tsx'],
  },
  { name: 'Pedidos (mesero)', path: '/pedidos', session: 'waiter', lazy: ['src/features/orders/OrdersView.tsx'] },
]
