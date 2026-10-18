import { Suspense } from 'react'

import { lazyNamed } from '@/components/lazyNamed'

// Solo la ve una pestaña de vista previa que ya terminó: no viaja en el paquete principal.
const PreviewEndedView = lazyNamed(() => import('./PreviewEndedView'), 'PreviewEndedView')

/** El aviso de la vista previa terminada, descargado recién al mostrarse. */
export function PreviewEndedGate() {
  return (
    <Suspense fallback={null}>
      <PreviewEndedView />
    </Suspense>
  )
}
