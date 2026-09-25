import FormMessage from '../../components/FormMessage'
import Icon from '../../components/Icon'
import { Button } from '../../components/ui/button'
import { errorMessage } from '../../services/api'
import { useClassifyWaste } from './useClassifyWaste'

interface ClassifyWasteButtonProps {
  readonly pending: number
}

function resumen(classified: number, remaining: number): string {
  const quedan = remaining > 0 ? `; quedan ${String(remaining)} sin clasificar` : ''
  return `Se clasificaron ${String(classified)} mermas${quedan}.`
}

/** Clasifica con la IA el motivo escrito de cada merma sin clasificar. */
export default function ClassifyWasteButton({ pending }: ClassifyWasteButtonProps) {
  const clasificar = useClassifyWaste()
  const resultado = clasificar.data

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        type="button"
        size="sm"
        disabled={pending === 0 || clasificar.isPending}
        onClick={() => {
          clasificar.mutate()
        }}
      >
        <Icon name="ia" size={14} className={clasificar.isPending ? 'animate-pulse' : undefined} />
        <span>{clasificar.isPending ? 'Clasificando…' : `Clasificar mermas pendientes (${String(pending)})`}</span>
      </Button>
      {clasificar.isError ? (
        <FormMessage tone="error">{errorMessage(clasificar.error, 'No se pudieron clasificar las mermas.')}</FormMessage>
      ) : null}
      {resultado === undefined ? null : (
        <FormMessage tone="ok">
          {resumen(resultado.classified, resultado.remaining)}
        </FormMessage>
      )}
    </div>
  )
}
