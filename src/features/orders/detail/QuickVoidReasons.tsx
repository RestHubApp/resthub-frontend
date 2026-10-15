import { Button } from '@/components/ui/button'
import { QUICK_VOID_REASONS } from './voidItemMessages'

interface QuickVoidReasonsProps {
  readonly onPick: (reason: string) => void
}

/** Los motivos rápidos: llenan el campo, que se puede corregir antes de anular. */
export function QuickVoidReasons({ onPick }: QuickVoidReasonsProps) {
  return (
    <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
      <legend className="mb-2 p-0 text-sm font-medium">Motivos rápidos</legend>
      <div className="flex flex-wrap gap-2">
        {QUICK_VOID_REASONS.map((reason) => (
          <Button
            key={reason}
            type="button"
            variant="outline"
            onClick={() => {
              onPick(reason)
            }}
          >
            {reason}
          </Button>
        ))}
      </div>
    </fieldset>
  )
}
