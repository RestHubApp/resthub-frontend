import { type ComponentProps, useRef } from 'react'

import { AlertDialogAction } from './ui/alert-dialog'

type ConfirmActionProps = Omit<ComponentProps<typeof AlertDialogAction>, 'onClick'> & {
  readonly onConfirm: () => void
}

/**
 * El botón que confirma, una sola vez por apertura. Al confirmar, la ventana
 * sigue montada y se puede pulsar durante su animación de salida: un doble
 * toque mandaría la acción dos veces. Vive dentro del contenido, que se
 * desmonta al cerrar, así que cada apertura empieza de cero.
 */
export function ConfirmAction({ onConfirm, ...props }: ConfirmActionProps) {
  const hasConfirmed = useRef(false)
  return (
    <AlertDialogAction
      {...props}
      onClick={(event) => {
        if (hasConfirmed.current) {
          event.preventDefault()
          return
        }
        hasConfirmed.current = true
        onConfirm()
      }}
    />
  )
}
