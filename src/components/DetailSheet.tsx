import type { ReactNode } from 'react'

import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useReturnFocus } from './useReturnFocus'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './ui/sheet'

interface DetailSheetProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly title: string
  readonly description?: ReactNode
  readonly children: ReactNode
  /** Los botones que cierran la tarea; quedan fijos al pie, al alcance del pulgar. */
  readonly footer?: ReactNode
}

const WIDE_SCREEN = '(min-width: 1024px)'

/**
 * El detalle o la configuración secundaria de algo, junto a la pantalla.
 *
 * Es una hoja a la derecha en la laptop, donde la lista sigue a la vista, y una
 * hoja desde abajo en el celular, con el botón principal al pie. Lo que se
 * consulta junto a una lista va aquí; una tarea corta de uno a tres campos va
 * en `FormDialog`. Nunca se abre una hoja o ventana sobre otra: si hace falta
 * confirmar, el contenido de la misma hoja cambia.
 */
export function DetailSheet({ open, onOpenChange, title, description, children, footer }: DetailSheetProps) {
  const isWide = useMediaQuery(WIDE_SCREEN)
  const returnFocus = useReturnFocus()
  const withoutDescription = description === undefined ? { 'aria-describedby': undefined } : {}

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        {...withoutDescription}
        {...returnFocus}
        side={isWide ? 'right' : 'bottom'}
        className={
          isWide
            ? 'w-full gap-0 sm:max-w-lg'
            : 'mx-auto max-h-[92dvh] w-full max-w-2xl gap-0 rounded-t-2xl'
        }
      >
        <SheetHeader className="gap-1 px-5 pt-5 pr-12 pb-3">
          <SheetTitle className="text-lg leading-tight font-semibold">{title}</SheetTitle>
          {description === undefined ? null : <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-5 pb-5">
          {children}
        </div>
        {footer === undefined ? null : (
          <div className="flex flex-col-reverse gap-2 border-t px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
