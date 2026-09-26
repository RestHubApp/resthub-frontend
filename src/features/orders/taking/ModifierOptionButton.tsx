import { Button } from '../../../components/ui/button'
import { formatMoney, toCents } from '../../../services/format'

interface ModifierOptionButtonProps {
  readonly name: string
  readonly price: string
  readonly selected: boolean
  readonly onToggle: () => void
}

/** Una opción del plato como ficha: marcada o no, con lo que suma al precio. */
export default function ModifierOptionButton({ name, price, selected, onToggle }: ModifierOptionButtonProps) {
  return (
    <Button
      type="button"
      variant={selected ? 'default' : 'outline'}
      aria-pressed={selected}
      className="h-auto min-h-11 flex-col gap-0 py-2"
      onClick={onToggle}
    >
      <span>{name}</span>
      {toCents(price) > 0 ? <span className="text-xs">+ {formatMoney(price)}</span> : null}
    </Button>
  )
}
