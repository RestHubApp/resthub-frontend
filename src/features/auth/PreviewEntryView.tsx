import { useLoaderData } from 'react-router'

import { FormMessage } from '@/components/FormMessage'
import { Icon } from '@/components/Icon'
import * as icons from '@/components/icons'
import { Button } from '@/components/ui/button'
import { appUrl } from '@/services/leaveTab'
import { paths } from '@/services/paths'
import { useSession } from '@/store/session'
import { AuthCard } from './AuthCard'
import { FAILURE_MESSAGES } from './previewCode'
import type { PreviewEntryResult } from './previewEntry'
import { PreviewEntryPending } from './PreviewEntryPending'

/**
 * Lo que queda en `/vista-previa` si el código no sirvió.
 *
 * Si sirvió, el `loader` ya llevó a la aplicación y esta pantalla no se ve.
 * El enlace de vuelta recarga la página: la pestaña deja de ser de vista
 * previa y vuelve a leer la sesión del navegador.
 */
export function PreviewEntryView() {
  const result = useLoaderData<PreviewEntryResult>()

  if (result === 'reloading') {
    return <PreviewEntryPending />
  }

  return (
    <main id="contenido" tabIndex={-1} className="flex min-h-dvh flex-col bg-background px-4 py-6 outline-none sm:px-6">
      <AuthCard title="No se pudo abrir la vista previa" description={FAILURE_MESSAGES[result]}>
        <div className="flex flex-col gap-4">
          <FormMessage tone="error">{FAILURE_MESSAGES[result]}</FormMessage>
          <p className="m-0 text-base text-muted-foreground">
            Pide otra desde «Vista previa» en la administración del sistema: cada código sirve una sola vez.
          </p>
          <Button type="button" variant="outline" className="w-full" onClick={() => {
            window.location.reload()
          }}>
            Reintentar
          </Button>
          <Button asChild className="w-full">
            <a
              href={appUrl(paths.platform.preview)}
              onClick={() => {
                useSession.getState().exitPreview()
              }}
            >
              <Icon glyph={icons.previous} size={18} />
              <span>Volver a la administración del sistema</span>
            </a>
          </Button>
        </div>
      </AuthCard>
    </main>
  )
}
