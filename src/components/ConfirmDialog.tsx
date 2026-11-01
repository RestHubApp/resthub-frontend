import type { ReactNode } from 'react'

import { useReturnFocus } from './useReturnFocus'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog'

interface ConfirmDialogProps {
  /** El boton que abre la confirmacion; sin el, el dialogo se controla con `open`. */
  readonly trigger?: ReactNode
  /** Abre o cierra la confirmacion desde afuera (p. ej. desde un menu «⋯»). */
  readonly open?: boolean | undefined
  readonly onOpenChange?: ((open: boolean) => void) | undefined
  readonly title: string
  readonly description: ReactNode
  readonly confirmLabel: string
  /** El botón que cierra sin hacer nada; por omisión, «Cancelar». */
  readonly cancelLabel?: string
  /** `default` para una accion afirmativa; `destructive` para una que quita algo. */
  readonly confirmVariant?: 'default' | 'destructive'
  readonly onConfirm: () => void
  /** Lo que se pide antes de confirmar (un motivo), entre el texto y los botones. */
  readonly children?: ReactNode
  /** La confirmación todavía no se puede dar: falta lo que se pide. */
  readonly isConfirmDisabled?: boolean
}

/**
 * Confirmacion antes de una accion que no se deshace.
 *
 * Reemplaza a `window.confirm`, que no toma el tema, no se puede leer bien en
 * todos los lectores de pantalla y en algunos navegadores se puede silenciar.
 */
export function ConfirmDialog({
  trigger,
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancelar',
  confirmVariant = 'destructive',
  onConfirm,
  children,
  isConfirmDisabled = false,
}: ConfirmDialogProps) {
  // Radix solo devuelve el foco a su propio disparador; abierta desde un menú
  // «⋯» o desde estado, la ventana recuerda quién lo tenía (ver `useReturnFocus`).
  const returnFocus = useReturnFocus()
  const controlled = {
    ...(open === undefined ? {} : { open }),
    ...(onOpenChange === undefined ? {} : { onOpenChange }),
  }

  return (
    <AlertDialog {...controlled}>
      {trigger === undefined ? null : <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent {...returnFocus}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction variant={confirmVariant} disabled={isConfirmDisabled} onClick={onConfirm}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
