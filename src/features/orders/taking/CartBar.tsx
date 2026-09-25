import Icon from '../../../components/Icon'
import { Button } from '../../../components/ui/button'
import { cartTotals } from './cartTotals'
import type { DraftLine } from './useOrderDraft'

interface CartBarProps {
  readonly lines: readonly DraftLine[]
  readonly submitLabel: string
  readonly pending: boolean
  readonly onOpen: () => void
  readonly onSubmit: () => void
}

/**
 * El pedido en curso, fijo abajo mientras se eligen platos.
 *
 * En el celular queda justo encima de la barra de navegacion; en la laptop,
 * al pie de la columna de contenido. El resumen se anuncia al cambiar, asi
 * quien usa lector de pantalla oye que el plato se agrego.
 * `data-cart-bar` lo usa index.css para subir el boton de accesibilidad.
 */
export default function CartBar({ lines, submitLabel, pending, onOpen, onSubmit }: CartBarProps) {
  const { platos, count, total } = cartTotals(lines)

  return (
    <div
      data-cart-bar=""
      className="fixed inset-x-0 bottom-[calc(4.0625rem+env(safe-area-inset-bottom))] z-30 border-t bg-card px-4 py-2.5 shadow-[0_-6px_16px_-8px_rgb(43_37_33/0.25)] lg:bottom-0 lg:left-60"
    >
      <div className="mx-auto flex max-w-[1100px] items-center gap-3">
        <button
          type="button"
          aria-haspopup="dialog"
          disabled={platos === 0}
          onClick={onOpen}
          className="flex min-h-12 flex-1 flex-col justify-center rounded-lg px-2 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-default"
        >
          <span aria-live="polite" className="text-sm text-muted-foreground">
            {platos === 0 ? 'Toca un plato' : `${count} · Ver y anotar`}
          </span>
          <span className="text-lg font-bold tabular-nums">{total}</span>
        </button>
        <Button type="button" size="lg" className="h-12 px-4 text-base" disabled={platos === 0 || pending} onClick={onSubmit}>
          <Icon name="enviar" size={18} />
          <span>{pending ? 'Enviando…' : submitLabel}</span>
        </Button>
      </div>
    </div>
  )
}
