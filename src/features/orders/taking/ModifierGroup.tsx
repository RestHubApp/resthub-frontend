import { ModifierOptionButton } from './ModifierOptionButton'
import type { ModifierGroupData } from './modifierSelection'

interface ModifierGroupProps {
  readonly group: ModifierGroupData
  /** Los nombres de las opciones ya elegidas de este grupo. */
  readonly chosen: readonly string[]
  readonly onToggle: (option: string) => void
}

/** Un grupo de opciones del plato: su titulo (obligatorio u opcional, con su tope) y las fichas. */
export function ModifierGroup({ group, chosen, onToggle }: ModifierGroupProps) {
  return (
    <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
      <legend className="mb-1 text-sm font-medium">
        {group.name}
        <span className="ml-2 text-xs text-muted-foreground">
          {group.min_choices > 0 ? 'Obligatorio' : 'Opcional'}
          {group.max_choices > 1 ? ` · hasta ${String(group.max_choices)}` : ''}
        </span>
      </legend>
      <div className="grid grid-cols-2 gap-2">
        {group.options.map((option) => (
          <ModifierOptionButton
            key={option.name}
            name={option.name}
            price={option.price}
            selected={chosen.includes(option.name)}
            onToggle={() => {
              onToggle(option.name)
            }}
          />
        ))}
      </div>
    </fieldset>
  )
}
