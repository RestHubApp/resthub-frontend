import type { PreviewAs } from '@/api/types'
import { FormMessage } from '@/components/FormMessage'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { errorMessage, errorStatus } from '@/services/api'
import { PREVIEW_AS_LABELS } from './previewLink'
import { PreviewOpenedNotice } from './PreviewOpenedNotice'
import { SandboxResetButton } from './SandboxResetButton'
import { usePreviewLauncher } from './usePreviewLauncher'

// El local de muestra no tiene una cuenta activa de ese tipo: el servidor
// sugiere reiniciarlo.
const CONFLICT = 409
const AS: readonly PreviewAs[] = ['owner', 'waiter']

/**
 * «Ver como encargado» y «Ver como mesero».
 *
 * Pide un código de un solo uso y abre con él una pestaña nueva, que entra al
 * local de muestra con su propia sesión. El código va en el caché de
 * mutaciones solo mientras alguien mira (`gcTime: 0`), como una contraseña.
 */
export function PreviewLauncher() {
  const { start, open, handleOpen, close } = usePreviewLauncher()

  return (
    <div className="flex flex-col items-start gap-4">
      <div className="flex w-full flex-wrap gap-3">
        {AS.map((as) => (
          <Button
            key={as}
            type="button"
            size="lg"
            className="h-11 w-full px-4 sm:w-auto"
            disabled={start.isPending}
            onClick={() => {
              handleOpen(as)
            }}
          >
            <Icon name="view" size={18} />
            <span>{start.isPending && start.variables === as ? 'Abriendo…' : `Ver como ${PREVIEW_AS_LABELS[as]}`}</span>
          </Button>
        ))}
      </div>
      {open === null ? null : <PreviewOpenedNotice label={PREVIEW_AS_LABELS[open.as]} url={open.url} onUsed={close} />}
      {start.isError ? (
        <FormMessage tone="error">{errorMessage(start.error, 'No se pudo abrir la vista previa.')}</FormMessage>
      ) : null}
      {errorStatus(start.error) === CONFLICT ? (
        <SandboxResetButton
          exists
          onReset={() => {
            start.reset()
          }}
        />
      ) : null}
    </div>
  )
}
