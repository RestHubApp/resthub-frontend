import { ErrorMessage } from '@/components/ErrorMessage'
import { FormSubmitButton } from '@/components/FormSubmitButton'
import * as icons from '@/components/icons'
import type { useUnlock } from './useUnlock'

/** El error del intento y el botón: los dos formularios de desbloqueo terminan igual. */
export function UnlockFooter({ unlock }: { readonly unlock: ReturnType<typeof useUnlock> }) {
  return (
    <>
      {unlock.isError ? <ErrorMessage error={unlock.error} fallback="No se pudo desbloquear. Inténtalo de nuevo." /> : null}
      <FormSubmitButton isPending={unlock.isPending} submit={{ label: 'Desbloquear', pendingLabel: 'Desbloqueando…', icon: icons.key }} />
    </>
  )
}
