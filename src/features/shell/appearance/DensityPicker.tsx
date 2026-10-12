import { DENSITIES } from '@/services/appearanceRules'
import { useAppearance } from '@/store/appearance'
import { OptionCard } from './OptionCard'
import { useFinePointer } from './useFinePointer'

/**
 * La densidad de los controles. Solo se ofrece con ratón o panel táctil: con el
 * dedo los controles miden siempre 44 px y no hay nada que elegir.
 */
export function DensityPicker() {
  const density = useAppearance((state) => state.appearance.density)
  const change = useAppearance((state) => state.change)
  const isFinePointer = useFinePointer()

  if (!isFinePointer) {
    return null
  }
  return (
    <section className="flex flex-col gap-2">
      <h2 className="m-0 font-heading text-lg leading-snug font-semibold text-foreground">Densidad</h2>
      <fieldset className="m-0 min-w-0 border-0 p-0">
        <legend className="sr-only">Densidad</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {DENSITIES.map((option) => (
            <OptionCard
              key={option.id}
              name="density"
              value={option.id}
              label={option.label}
              description={option.description}
              isChecked={density === option.id}
              onSelect={() => {
                change({ density: option.id })
              }}
            />
          ))}
        </div>
      </fieldset>
    </section>
  )
}
