import type { ReactNode } from 'react'

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
  /** `default` para una accion afirmativa; `destructive` para una que quita algo. */
  readonly confirmVariant?: 'default' | 'destructive'
  readonly onConfirm: () => void
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
  confirmVariant = 'destructive',
  onConfirm,
}: ConfirmDialogProps) {
  const controlled = {
    ...(open === undefined ? {} : { open }),
    ...(onOpenChange === undefined ? {} : { onOpenChange }),
  }

  return (
    <AlertDialog {...controlled}>
      {trigger === undefined ? null : <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant={confirmVariant} onClick={onConfirm}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
