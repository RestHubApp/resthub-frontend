import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  platformActivityQueryKey,
  platformMutationKeys,
  platformSandboxQueryKey,
  resetPlatformSandbox,
} from '../../api/platform'
import ConfirmDialog from '../../components/ConfirmDialog'
import FormMessage from '../../components/FormMessage'
import Icon from '../../components/Icon'
import { Button } from '../../components/ui/button'
import { errorMessage } from '../../services/api'

interface SandboxResetButtonProps {
  /** Si ya existe un local de muestra: la confirmación explica que se archiva. */
  readonly exists: boolean
  /** Después de reiniciar, por ejemplo para quitar el aviso que lo sugería. */
  readonly onReset?: () => void
}

/**
 * «Reiniciar local de muestra», con confirmación.
 *
 * El local vigente no se borra: queda desactivado como histórico y se crea
 * uno nuevo con los datos de muestra de siempre. Quien tenga una vista previa
 * abierta en el viejo pierde el acceso.
 */
export default function SandboxResetButton({ exists, onReset }: SandboxResetButtonProps) {
  const queryClient = useQueryClient()
  const reinicio = useMutation({
    mutationKey: platformMutationKeys.resetSandbox,
    mutationFn: resetPlatformSandbox,
    onSuccess: (muestra) => {
      queryClient.setQueryData(platformSandboxQueryKey, muestra)
      void queryClient.invalidateQueries({ queryKey: platformActivityQueryKey })
      onReset?.()
    },
  })

  return (
    <div className="flex flex-col items-start gap-3">
      <ConfirmDialog
        trigger={
          <Button type="button" size="lg" variant="danger" className="h-11 px-4" disabled={reinicio.isPending}>
            <Icon name="actualizar" size={18} />
            <span>{reinicio.isPending ? 'Reiniciando…' : 'Reiniciar local de muestra'}</span>
          </Button>
        }
        title="¿Reiniciar el local de muestra?"
        description={
          exists
            ? 'Los datos actuales del local de muestra (pedidos, caja, cambios en la carta, el inventario y el personal) se archivan: ese local queda desactivado como histórico y se crea uno nuevo con los datos de muestra de siempre. Quien tenga una vista previa abierta pierde el acceso. Ningún restaurante real se toca.'
            : 'Se crea el local de muestra con sus datos de siempre. Ningún restaurante real se toca.'
        }
        confirmLabel="Reiniciar"
        onConfirm={() => {
          reinicio.mutate()
        }}
      />
      {reinicio.isError ? (
        <FormMessage tone="error">{errorMessage(reinicio.error, 'No se pudo reiniciar el local de muestra.')}</FormMessage>
      ) : null}
      {reinicio.isSuccess ? <FormMessage tone="ok">Listo: el local de muestra empieza de nuevo.</FormMessage> : null}
    </div>
  )
}
