import Icon from '../../../components/Icon'
import { Button } from '../../../components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '../../../components/ui/sheet'
import CartLine from './CartLine'
import { cartTotals } from './cartTotals'
import type { DraftLine } from './useOrderDraft'

interface CartSheetProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly title: string
  readonly lines: readonly DraftLine[]
  readonly onQuantity: (lineKey: string, quantity: number) => void
  readonly onNotes: (lineKey: string, notes: string) => void
  readonly submitLabel: string
  readonly pending: boolean
  readonly onSubmit: () => void
}

/**
 * El pedido antes de mandarlo: cantidades, notas y total.
 *
 * Sube desde abajo, como el resto de lo que se abre en el celular, y deja el
 * boton de enviar al alcance del pulgar al pie.
 */
export default function CartSheet({
  open,
  onOpenChange,
  title,
  lines,
  onQuantity,
  onNotes,
  submitLabel,
  pending,
  onSubmit,
}: CartSheetProps) {
  const { count, total } = cartTotals(lines)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[90dvh] w-full max-w-2xl gap-4 overflow-y-auto rounded-t-2xl px-4 pt-5 pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <SheetTitle className="m-0 pr-10 font-heading text-lg font-semibold">{title}</SheetTitle>
        <SheetDescription className="m-0">
          Revisa las cantidades y anota lo que la cocina tiene que saber.
        </SheetDescription>
        {lines.length === 0 ? (
          <p className="m-0 py-6 text-center text-muted-foreground">Todavía no elegiste platos.</p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-4 p-0">
            {lines.map((line) => (
              <CartLine
                key={line.lineKey}
                line={line}
                onQuantity={(cantidad) => {
                  onQuantity(line.lineKey, cantidad)
                }}
                onNotes={(nota) => {
                  onNotes(line.lineKey, nota)
                }}
              />
            ))}
          </ul>
        )}
        <div className="flex items-baseline justify-between border-t pt-3">
          <span className="text-muted-foreground">{count}</span>
          <span className="text-xl font-bold tabular-nums">{total}</span>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" size="lg" className="h-12 px-4" onClick={() => {
            onOpenChange(false)
          }}>
            Seguir eligiendo
          </Button>
          <Button type="button" size="lg" className="h-12 px-5 text-base" disabled={lines.length === 0 || pending} onClick={onSubmit}>
            <Icon name="enviar" size={18} />
            <span>{pending ? 'Enviando…' : submitLabel}</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
