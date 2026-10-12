import { PLATFORM_PERMISSION } from '@/api/permissions'
import { asDefault } from '@/components/lazyNamed'
import { paths, routePatterns } from '@/services/paths'
import type { Screen } from './screenTypes'

/**
 * Las pantallas de la administración del sistema.
 *
 * Son pantallas como las del restaurante: el mismo armazón, la misma guarda y
 * el mismo menú, que solo las muestra a quien tiene su permiso `platform.*`.
 * Siguen siendo perezosas: el celular del mesero no baja su código. Van al
 * final del registro porque ninguna cuenta del personal las ve.
 */
export const PLATFORM_SCREENS: readonly Screen[] = [
  {
    path: routePatterns.platform,
    permission: PLATFORM_PERMISSION.restaurantsRead,
    nav: {
      label: 'Restaurantes',
      icon: 'restaurant',
      description: 'Los restaurantes de RestHub, su estado y sus encargados.',
      // La ficha y el alta de un restaurante siguen marcando esta entrada.
      activeOn: [paths.platform.restaurant('')],
    },
    load: asDefault(() => import('@/features/platform/RestaurantsView'), 'RestaurantsView'),
  },
  {
    path: routePatterns.newRestaurant,
    permission: PLATFORM_PERMISSION.restaurantsManage,
    load: asDefault(() => import('@/features/platform/NewRestaurantView'), 'NewRestaurantView'),
  },
  {
    path: routePatterns.restaurantDetail,
    permission: PLATFORM_PERMISSION.restaurantsRead,
    load: asDefault(() => import('@/features/platform/RestaurantDetailView'), 'RestaurantDetailView'),
  },
  {
    path: routePatterns.activity,
    permission: PLATFORM_PERMISSION.activityRead,
    nav: { label: 'Bitácora', icon: 'history', description: 'Lo que se hizo en la plataforma: altas, cambios y accesos.' },
    load: asDefault(() => import('@/features/platform/ActivityView'), 'ActivityView'),
  },
  {
    path: routePatterns.platformPreview,
    permission: PLATFORM_PERMISSION.previewOpen,
    nav: { label: 'Vista previa', icon: 'view', description: 'Ver RestHub como el encargado o el mesero del local de muestra.' },
    load: asDefault(() => import('@/features/platform/PreviewView'), 'PreviewView'),
  },
  {
    path: routePatterns.observability,
    permission: PLATFORM_PERMISSION.observabilityRead,
    nav: { label: 'Observabilidad', icon: 'observability', description: 'Tráfico, errores y registros del servidor.' },
    load: asDefault(() => import('@/features/platform/observability/ObservabilityView'), 'ObservabilityView'),
  },
]
