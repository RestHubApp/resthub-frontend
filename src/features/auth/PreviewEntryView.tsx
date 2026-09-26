import { useLoaderData } from 'react-router'

import Icon from '../../components/Icon'
import { Button } from '../../components/ui/button'
import { appUrl } from '../../services/leaveTab'
import { useSession } from '../../store/session'
import AuthCard from './AuthCard'
import { FAILURE_MESSAGES } from './previewCode'
import type { PreviewEntryResult } from './previewEntry'
import PreviewEntryPending from './PreviewEntryPending'

/**
 * Lo que queda en `/vista-previa` si el código no sirvió.
 *
 * Si sirvió, el `loader` ya llevó a la aplicación y esta pantalla no se ve.
 * El enlace de vuelta recarga la página: la pestaña deja de ser de vista
 * previa y vuelve a leer la sesión de plataforma del navegador.
 */
export default function PreviewEntryView() {
  const resultado = useLoaderData<PreviewEntryResult>()

  if (resultado === 'reloading') {
    return <PreviewEntryPending />
  }

  return (
    <main id="contenido" tabIndex={-1} className="flex min-h-dvh flex-col bg-background px-4 py-6 outline-none sm:px-6">
      <AuthCard title="No se pudo abrir la vista previa" description={FAILURE_MESSAGES[resultado]}>
        <div className="flex flex-col gap-4">
          <p className="m-0 text-base text-muted-foreground">
            Pide otra desde «Vista previa» en la administración del sistema: cada código sirve una sola vez.
          </p>
          <Button asChild size="lg" className="h-11 w-full">
            <a
              href={appUrl('/plataforma/vista-previa')}
              onClick={() => {
                useSession.getState().exitPreview()
              }}
            >
              <Icon name="anterior" size={18} />
              <span>Volver a la administración del sistema</span>
            </a>
          </Button>
        </div>
      </AuthCard>
    </main>
  )
}
