import { Suspense } from 'react'
import type { RouteObject } from 'react-router'

import { lazyNamed } from '@/components/lazyNamed'
import { PreviewEntryPending } from '@/features/auth/PreviewEntryPending'
import { routePatterns } from '@/services/paths'
import { RouteBoundary } from './RouteBoundary'

const PreviewEntryRoute = lazyNamed(() => import('@/features/auth/PreviewEntryRoute'), 'PreviewEntryRoute')

/**
 * La pestaña que abre «Ver como…» en el área de plataforma.
 *
 * Va fuera de las dos guardas: canjea el código de un solo uso (una vez por
 * llegada a la ruta, `enterPreviewOnce`) y lleva al armazón del restaurante con
 * la sesión de vista previa, que vive solo en esta pestaña.
 */
export const PREVIEW: RouteObject = {
  path: routePatterns.previewEntry,
  element: (
    <RouteBoundary>
      <Suspense fallback={<PreviewEntryPending />}>
        <PreviewEntryRoute />
      </Suspense>
    </RouteBoundary>
  ),
}
