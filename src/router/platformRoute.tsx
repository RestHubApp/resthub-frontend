import { Navigate, type RouteObject } from 'react-router'

import { paths, routePatterns } from '@/services/paths'
import { platform } from './lazyRoute'

/**
 * El área del administrador del sistema, aparte del armazón de un restaurante.
 *
 * Cada pantalla va en su propio archivo: el celular del mesero nunca baja este
 * código ni la sesión de plataforma. La guarda mira solo esa sesión; una
 * sesión de restaurante abierta no entra.
 */
export const PLATFORM: RouteObject = {
  path: routePatterns.platform,
  ...platform(() => import('@/features/platform/PlatformShell'), 'PlatformShell'),
  children: [
    { path: routePatterns.platformLogin, ...platform(() => import('@/features/platform/PlatformLoginView'), 'PlatformLoginView') },
    {
      ...platform(() => import('@/features/platform/RequirePlatformSession'), 'RequirePlatformSession'),
      children: [
        { index: true, ...platform(() => import('@/features/platform/RestaurantsView'), 'RestaurantsView') },
        { path: routePatterns.newRestaurant, ...platform(() => import('@/features/platform/NewRestaurantView'), 'NewRestaurantView') },
        { path: routePatterns.restaurantDetail, ...platform(() => import('@/features/platform/RestaurantDetailView'), 'RestaurantDetailView') },
        { path: routePatterns.activity, ...platform(() => import('@/features/platform/ActivityView'), 'ActivityView') },
        { path: routePatterns.platformPreview, ...platform(() => import('@/features/platform/PreviewView'), 'PreviewView') },
        {
          path: routePatterns.observability,
          ...platform(() => import('@/features/platform/observability/ObservabilityView'), 'ObservabilityView'),
        },
      ],
    },
    { path: '*', element: <Navigate to={paths.platform.home} replace /> },
  ],
}
