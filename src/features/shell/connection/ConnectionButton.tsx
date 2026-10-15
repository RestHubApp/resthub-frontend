import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ShellIcon } from '@/features/shell/ShellIcon'
import { connectionLabel, STATE_COPY } from './connectionCopy'
import { ConnectionPanel } from './ConnectionPanel'
import { useConnection } from './useConnection'

// Más de dos cifras no entran en el globito.
const MAX_BADGE = 9

/**
 * El botón cuadrado «Conexión en vivo» del pie de la barra lateral: un punto
 * de color (verde, ámbar o rojo) sobre un ícono distinto por estado y, si hay
 * pedidos tomados sin señal, cuántos. Abre un panel que lo explica y deja
 * reintentar el envío de la cola.
 */
export function ConnectionButton() {
  const connection = useConnection()
  const { state, pending } = connection
  const copy = STATE_COPY[state]
  const label = connectionLabel(state, pending.length)

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="relative size-11" aria-label={label} title={label} data-connection={state}>
          <ShellIcon name={copy.icon} size={20} />
          <span aria-hidden="true" className={`absolute right-2 bottom-2 size-2.5 rounded-full ring-2 ring-card ${copy.dot}`} />
          {pending.length > 0 ? (
            <span
              aria-hidden="true"
              className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[0.625rem] leading-none font-semibold text-primary-foreground"
            >
              {pending.length > MAX_BADGE ? `${String(MAX_BADGE)}+` : pending.length}
            </span>
          ) : null}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="gap-4 px-4 pt-5 pb-4 lg:max-w-xs">
        <SheetTitle className="m-0 font-heading text-lg font-semibold">Conexión en vivo</SheetTitle>
        <SheetDescription className="sr-only">Si este equipo tiene internet, si la pantalla se actualiza sola y los pedidos sin enviar.</SheetDescription>
        <ConnectionPanel connection={connection} />
      </SheetContent>
    </Sheet>
  )
}
