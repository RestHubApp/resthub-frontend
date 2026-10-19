import { SegmentedChoice } from '@/components/SegmentedChoice'
import type { CountOption } from './countEntry'

interface CountModePickerProps {
  /** Único por línea: agrupa los botones de radio de esta línea. */
  readonly name: string
  readonly options: readonly CountOption[]
  readonly value: string
  readonly onChange: (value: string) => void
}

/**
 * Cómo se cuenta la línea: en su unidad, en envases o por peso. Botones
 * grandes, para el dedo en la barra. Con una sola forma no se muestra.
 */
export function CountModePicker({ name, options, value, onChange }: CountModePickerProps) {
  if (options.length < 2) {
    return null
  }
  return <SegmentedChoice legend="Cómo cuentas" name={name} options={options} value={value} onChange={onChange} />
}
