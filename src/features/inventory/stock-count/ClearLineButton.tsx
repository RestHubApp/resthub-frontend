import type { CountLineRequest, StockCountLine } from '@/api/types'
import { Button } from '@/components/ui/button'
import { clearLinePayload } from './countEntry'

interface ClearLineButtonProps {
  readonly line: StockCountLine
  readonly isPending: boolean
  readonly onClear: (payload: CountLineRequest) => void
}

/** Vuelve a dejar la línea sin contar, por si se contó el insumo equivocado. Solo en las contadas. */
export function ClearLineButton({ line, isPending, onClear }: ClearLineButtonProps) {
  if (line.counted === null) {
    return null
  }
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="self-start"
      disabled={isPending}
      onClick={() => {
        onClear(clearLinePayload(line))
      }}
    >
      Dejar sin contar
    </Button>
  )
}
