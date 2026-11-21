import { use } from 'react'
import { Navigate, useLocation } from 'react-router'

import { paths } from '@/services/paths'
import { enterPreviewOnce } from './previewEntry'
import { PreviewEntryPending } from './PreviewEntryPending'
import { PreviewEntryView } from './PreviewEntryView'

/**
 * `/vista-previa`: canjea el código y entra al inicio con la sesión de vista
 * previa, o muestra por qué no se pudo. Mientras canjea, el `Suspense` de la
 * ruta muestra `PreviewEntryPending`.
 */
export function PreviewEntryRoute() {
  const { key } = useLocation()
  const outcome = use(enterPreviewOnce(key))
  if (outcome !== 'entered') {
    return <PreviewEntryView result={outcome} />
  }
  // `Navigate` lleva al inicio en un efecto: mientras tanto sigue el aviso, no una página en blanco.
  return (
    <>
      <Navigate to={paths.home} replace />
      <PreviewEntryPending />
    </>
  )
}
