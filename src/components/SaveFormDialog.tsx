import type { ReactNode, SyntheticEvent } from 'react'

import { FormDialog } from './FormDialog'
import { FormFooter } from './FormFooter'
import { onSubmit } from '@/hooks/formSubmit'

interface SaveFormDialogProps {
  readonly open: boolean
  readonly title: string
  /** Cierra la ventana; quien la usa deja el formulario en sus valores iniciales. */
  readonly onClose: () => void
  /** La mutación que guarda. */
  readonly save: {
    readonly isError: boolean
    readonly error: unknown
    readonly isPending: boolean
    readonly reset: () => void
  }
  readonly failureText: string
  /** El manejador de react-hook-form, ya con su envío. */
  readonly handleSubmit: (event: SyntheticEvent<HTMLFormElement>) => Promise<unknown>
  readonly children: ReactNode
}

/**
 * Una ventana con un formulario de dos columnas que guarda una sola cosa, como
 * un cliente o una reserva: los campos, el error del envío y "Cancelar" /
 * "Guardar". Al cerrarla se descarta el error del último intento.
 */
export function SaveFormDialog({ open, title, onClose, save, failureText, handleSubmit, children }: SaveFormDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          save.reset()
          onClose()
        }
      }}
      title={title}
      size="lg"
    >
      <form noValidate className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit(handleSubmit)}>
        {children}
        <FormFooter
          mutation={save}
          failureText={failureText}
          onCancel={onClose}
          submit={{ label: 'Guardar', pendingLabel: 'Guardando…' }}
          size="lg"
          spansColumns
        />
      </form>
    </FormDialog>
  )
}
