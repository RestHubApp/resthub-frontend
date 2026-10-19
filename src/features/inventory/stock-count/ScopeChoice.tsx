import { SegmentedChoice } from '@/components/SegmentedChoice'

/** Todos los insumos activos, o solo los elegidos. */
export type CountScope = 'all' | 'selected'

interface ScopeChoiceProps {
  readonly value: CountScope
  readonly onChange: (value: CountScope) => void
  /** Cuántos insumos activos hay: lo que entra con «Todos». */
  readonly total: number
}

/** Qué se cuenta: el inventario entero o una selección. */
export function ScopeChoice({ value, onChange, total }: ScopeChoiceProps) {
  return (
    <SegmentedChoice
      legend="¿Qué vas a contar?"
      isLegendVisible
      name="alcance-conteo"
      layout="fill"
      options={[
        { value: 'all', label: `Todos los insumos (${String(total)})` },
        { value: 'selected', label: 'Solo algunos' },
      ]}
      value={value}
      onChange={onChange}
    />
  )
}
