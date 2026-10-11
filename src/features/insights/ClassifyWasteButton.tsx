import { FormMessage } from '@/components/FormMessage'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { errorMessage } from '@/services/api'
import { useClassifyWaste } from './useClassifyWaste'

interface ClassifyWasteButtonProps {
  readonly pending: number
}

function summary(classified: number, remaining: number): string {
  const remain = remaining > 0 ? `; quedan ${String(remaining)} sin clasificar` : ''
  return `Se clasificaron ${String(classified)} mermas${remain}.`
}

/** Clasifica con la IA el motivo escrito de cada merma sin clasificar. */
export function ClassifyWasteButton({ pending }: ClassifyWasteButtonProps) {
  const classify = useClassifyWaste()
  const result = classify.data

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        type="button"
        size="sm"
        disabled={pending === 0 || classify.isPending}
        onClick={() => {
          classify.mutate()
        }}
      >
        <Icon name="ia" size={14} className={classify.isPending ? 'animate-pulse' : undefined} />
        <span>{classify.isPending ? 'Clasificando…' : `Clasificar mermas pendientes (${String(pending)})`}</span>
      </Button>
      {classify.isError ? (
        <FormMessage tone="error">{errorMessage(classify.error, 'No se pudieron clasificar las mermas.')}</FormMessage>
      ) : null}
      {result === undefined ? null : (
        <FormMessage tone="ok">
          {summary(result.classified, result.remaining)}
        </FormMessage>
      )}
    </div>
  )
}
