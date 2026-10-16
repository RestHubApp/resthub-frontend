import type { CountDraft, CountOption } from './countEntry'
import { CountAmountField } from './CountAmountField'

interface CountLineFieldsProps {
  readonly ingredientId: number
  readonly option: CountOption | undefined
  readonly draft: CountDraft
  readonly onChange: (draft: CountDraft) => void
  readonly isInvalid: boolean
  readonly readingId: string
}

/** Lo que se escribe según cómo se cuenta: la cantidad, o el peso del abierto y los cerrados. */
export function CountLineFields({ ingredientId, option, draft, onChange, isInvalid, readingId }: CountLineFieldsProps) {
  const isWeight = option?.mode === 'weight'
  return (
    <>
      <CountAmountField
        id={`conteo-${String(ingredientId)}`}
        label={isWeight ? 'Peso del abierto (g)' : `Cantidad (${option?.label ?? ''})`}
        value={draft.quantity}
        isInvalid={isInvalid}
        describedBy={readingId}
        onChange={(quantity) => {
          onChange({ ...draft, quantity })
        }}
      />
      {isWeight ? (
        <CountAmountField
          id={`conteo-cerrados-${String(ingredientId)}`}
          label="Cerrados, además"
          value={draft.fullPackages}
          describedBy={readingId}
          onChange={(fullPackages) => {
            onChange({ ...draft, fullPackages })
          }}
        />
      ) : null}
    </>
  )
}
