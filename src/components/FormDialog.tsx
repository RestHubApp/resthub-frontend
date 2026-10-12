import { useMutationState } from '@tanstack/react-query'
import { type ReactNode, useState } from 'react'

import { FormMessage } from './FormMessage'
import { useReturnFocus } from './useReturnFocus'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'

interface FormDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly title: string
  readonly description?: ReactNode
  /** `lg` para formularios de dos columnas o con listas largas, como los permisos. */
  readonly size?: 'md' | 'lg'
  readonly children: ReactNode
}

const WIDTHS = { md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' } as const

/**
 * Un formulario en una ventana sobre la pantalla.
 *
 * Deja la pantalla para lo que se consulta, la tabla o el cuadro, y trae el
 * formulario solo cuando alguien va a cargar algo. La primitiva de Radix
 * encierra el foco adentro y cierra con Escape. Un formulario largo se
 * desplaza dentro de la ventana, también en el celular.
 */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  size = 'md',
  children,
}: FormDialogProps) {
  // La ventana se abre desde estado y no desde su propio disparador: el foco
  // vuelve a quien la abrió (ver `useReturnFocus`).
  const [openFrom, setOpenFrom] = useState(0)
  const returnFocus = useReturnFocus(() => {
    setOpenFrom(Date.now())
  })
  const failures = useMutationState({
    filters: { status: 'error' },
    select: (mutation) => mutation.state.submittedAt,
  })
  const hasFailureInThisDialog = open && failures.some((moment) => moment >= openFrom)
  // Sin descripción, Radix pide decirlo explícitamente para no anunciar un vacío.
  const withoutDescription = description === undefined ? { 'aria-describedby': undefined } : {}

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        {...withoutDescription}
        className={`max-h-[calc(100dvh-2rem)] gap-5 overflow-y-auto p-5 sm:p-6 ${WIDTHS[size]}`}
        {...returnFocus}
      >
        <DialogHeader className="gap-1.5 pr-8">
          <DialogTitle className="text-lg leading-tight font-semibold">{title}</DialogTitle>
          {description === undefined ? null : <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {hasFailureInThisDialog ? (
          // De respaldo: si el formulario ya dice por qué no se guardó, no se repite.
          <div className="[[role=dialog]:has([data-falla=propia])_&]:hidden">
            <FormMessage tone="error" fallback>
              No se pudo guardar. Los datos siguen aquí; vuelve a intentarlo cuando el servicio responda.
            </FormMessage>
          </div>
        ) : null}
        {children}
      </DialogContent>
    </Dialog>
  )
}
