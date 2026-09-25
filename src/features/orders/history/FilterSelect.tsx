import type { ReactNode } from 'react'

import { Label } from '../../../components/ui/label'
import { NativeSelect, NativeSelectOption } from '../../../components/ui/native-select'

interface FilterSelectProps {
  readonly id: string
  readonly label: string
  readonly value: string
  readonly onChange: (value: string) => void
  /** El texto de la opcion vacia, la que no filtra. */
  readonly anyLabel: string
  readonly children: ReactNode
}

/** Una lista de un filtro, con su etiqueta visible. */
export default function FilterSelect({ id, label, value, onChange, anyLabel, children }: FilterSelectProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <NativeSelect
        id={id}
        className="w-full [&_select]:h-11"
        value={value}
        onChange={(event) => {
          onChange(event.target.value)
        }}
      >
        <NativeSelectOption value="">{anyLabel}</NativeSelectOption>
        {children}
      </NativeSelect>
    </div>
  )
}
