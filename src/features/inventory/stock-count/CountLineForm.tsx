import type { StockCountLine } from '@/api/types'
import { Button } from '@/components/ui/button'
import { InventoryFailure } from '@/features/inventory/InventoryFailure'
import { ClearLineButton } from './ClearLineButton'
import { CountLineFields } from './CountLineFields'
import { CountModePicker } from './CountModePicker'
import { CountReadingText } from './CountReadingText'
import { useCountLine } from './useCountLine'

interface CountLineFormProps {
  readonly countId: number
  readonly line: StockCountLine
}

/**
 * Lo contado de un insumo, con la conversión en vivo.
 *
 * Se guarda línea por línea: si se corta la señal o se cierra la pestaña, lo
 * ya guardado no se pierde. Enter guarda.
 */
export function CountLineForm({ countId, line }: CountLineFormProps) {
  const { draft, setDraft, options, reading, record, submit, clear } = useCountLine(countId, line)
  const readingId = `conteo-lectura-${String(line.ingredient_id)}`

  return (
    <form noValidate aria-label={`Conteo de ${line.ingredient_name}`} className="flex flex-col gap-3" onSubmit={submit}>
      <CountModePicker
        name={`modo-${String(line.ingredient_id)}`}
        options={options}
        value={draft.option}
        onChange={(option) => {
          setDraft({ ...draft, option })
        }}
      />
      <div className="flex flex-wrap items-end gap-2">
        <CountLineFields
          ingredientId={line.ingredient_id}
          option={options.find((option) => option.value === draft.option)}
          draft={draft}
          onChange={setDraft}
          isInvalid={reading.error !== null}
          readingId={readingId}
        />
        <Button type="submit" className="h-11" disabled={reading.base === null || record.isPending}>
          {record.isPending ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>
      <CountReadingText id={readingId} reading={reading} line={line} />
      <InventoryFailure mutation={record} fallback="No se pudo guardar lo contado." />
      <ClearLineButton line={line} isPending={record.isPending} onClear={clear} />
    </form>
  )
}
