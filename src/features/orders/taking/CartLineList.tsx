import { CartLine } from './CartLine'
import type { DraftLine } from './useOrderDraft'

interface CartLineListProps {
  readonly lines: readonly DraftLine[]
  readonly onQuantity: (lineKey: string, quantity: number) => void
  readonly onNotes: (lineKey: string, notes: string) => void
}

/** Las lineas del resumen del pedido, o el aviso de que todavia no hay platos. */
export function CartLineList({ lines, onQuantity, onNotes }: CartLineListProps) {
  if (lines.length === 0) {
    return <p className="m-0 py-6 text-center text-muted-foreground">Todavía no elegiste platos.</p>
  }

  return (
    <ul className="m-0 flex list-none flex-col gap-4 p-0">
      {lines.map((line) => (
        <CartLine
          key={line.lineKey}
          line={line}
          onQuantity={(quantity) => {
            onQuantity(line.lineKey, quantity)
          }}
          onNotes={(note) => {
            onNotes(line.lineKey, note)
          }}
        />
      ))}
    </ul>
  )
}
