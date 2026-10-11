import type { RouteObject } from 'react-router'

import { asDefault } from '@/components/lazyNamed'
import { PreviewEntryPending } from '@/features/auth/PreviewEntryPending'
import { routePatterns } from '@/services/paths'

/**
 * La pestaña que abre «Ver como…» en el área de plataforma.
 *
 * Va fuera de las dos guardas: canjea el código de un solo uso (el `loader`,
 * que corre una vez por carga) y lleva al armazón del restaurante con la
 * sesión de vista previa, que vive solo en esta pestaña.
 */
export const PREVIEW: RouteObject = {
  path: routePatterns.previewEntry,
  hydrateFallbackElement: <PreviewEntryPending />,
  lazy: {
    loader: async () => (await import('@/features/auth/previewEntry')).previewEntryLoader,
    Component: async () => (await asDefault(() => import('@/features/auth/PreviewEntryView'), 'PreviewEntryView')()).default,
  },
}
