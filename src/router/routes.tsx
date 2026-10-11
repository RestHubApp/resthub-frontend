import type { ComponentType } from 'react'
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router'

import { asDefault } from '@/components/lazyNamed'
import { EmptyState } from '@/components/EmptyState'
import { PreviewEntryPending } from '@/features/auth/PreviewEntryPending'
import { AppShell } from '@/features/shell/AppShell'
import { HomeRedirect } from '@/features/shell/HomeRedirect'
import { PreviewPlatformGate } from '@/features/shell/PreviewPlatformGate'
import { RequireSession } from '@/features/shell/RequireSession'
import { paths, routePatterns } from '@/services/paths'
import { SCREENS, type Screen } from './screens'

// Al abrir la aplicacion directo en una pantalla perezosa (recargar el
// tablero), esto se ve dentro del armazon mientras llega su archivo.
const CARGANDO = <EmptyState title="Cargando…" />

type LoadScreen = () => Promise<{ default: ComponentType }>

/** Una ruta cuya pantalla se descarga recién al abrirla. */
function lazyRoute(load: LoadScreen) {
  return { hydrateFallbackElement: CARGANDO, lazy: { Component: async () => (await load()).default } } as const
}

/** Una pantalla del área de plataforma, que se descarga recién al abrirla. */
function plataforma<K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) {
  return lazyRoute(asDefault(load, name))
}

/**
 * La ruta de una pantalla del registro, detrás de su guarda.
 *
 * El permiso es una comodidad de la interfaz: la autorizacion de verdad la
 * aplica el servidor en cada peticion, y esta guarda solo evita mostrar una
 * pantalla que va a responder 403. Es el mismo del registro que muestra la
 * entrada del menu.
 */
function screenRoute({ path, load, permission, public: isPublic }: Screen): RouteObject {
  const route = { path, ...lazyRoute(load) }
  return isPublic === true ? route : { element: <RequireSession permission={permission} />, children: [route] }
}

/**
 * El área del administrador del sistema, aparte del armazón de un restaurante.
 *
 * Cada pantalla va en su propio archivo: el celular del mesero nunca baja este
 * código ni la sesión de plataforma. La guarda mira solo esa sesión; una
 * sesión de restaurante abierta no entra.
 */
const PLATAFORMA: RouteObject = {
  path: routePatterns.platform,
  ...plataforma(() => import('@/features/platform/PlatformShell'), 'PlatformShell'),
  children: [
    { path: routePatterns.platformLogin, ...plataforma(() => import('@/features/platform/PlatformLoginView'), 'PlatformLoginView') },
    {
      ...plataforma(() => import('@/features/platform/RequirePlatformSession'), 'RequirePlatformSession'),
      children: [
        { index: true, ...plataforma(() => import('@/features/platform/RestaurantsView'), 'RestaurantsView') },
        { path: routePatterns.newRestaurant, ...plataforma(() => import('@/features/platform/NewRestaurantView'), 'NewRestaurantView') },
        { path: routePatterns.restaurantDetail, ...plataforma(() => import('@/features/platform/RestaurantDetailView'), 'RestaurantDetailView') },
        { path: routePatterns.activity, ...plataforma(() => import('@/features/platform/ActivityView'), 'ActivityView') },
        { path: routePatterns.platformPreview, ...plataforma(() => import('@/features/platform/PreviewView'), 'PreviewView') },
        {
          path: routePatterns.observability,
          ...plataforma(() => import('@/features/platform/observability/ObservabilityView'), 'ObservabilityView'),
        },
      ],
    },
    { path: '*', element: <Navigate to={paths.platform.home} replace /> },
  ],
}

/**
 * La pestaña que abre «Ver como…» en el área de plataforma.
 *
 * Va fuera de las dos guardas: canjea el código de un solo uso (el `loader`,
 * que corre una vez por carga) y lleva al armazón del restaurante con la
 * sesión de vista previa, que vive solo en esta pestaña.
 */
const VISTA_PREVIA: RouteObject = {
  path: routePatterns.previewEntry,
  hydrateFallbackElement: <PreviewEntryPending />,
  lazy: {
    loader: async () => (await import('@/features/auth/previewEntry')).previewEntryLoader,
    Component: async () => (await asDefault(() => import('@/features/auth/PreviewEntryView'), 'PreviewEntryView')()).default,
  },
}

export const router = createBrowserRouter(
  [
    // En una pestaña de vista previa, la puerta muestra un aviso en vez del área.
    { element: <PreviewPlatformGate />, children: [PLATAFORMA] },
    VISTA_PREVIA,
    {
      path: routePatterns.home,
      element: <AppShell screens={SCREENS} />,
      children: [
        { index: true, Component: HomeRedirect },
        ...SCREENS.map(screenRoute),
        // Cualquier ruta que no exista lleva al inicio de cada cuenta, no a un error.
        { path: '*', element: <Navigate to={paths.home} replace /> },
      ],
    },
  ],
  {
    basename: import.meta.env.BASE_URL,
  },
)
