import { useId } from 'react'

import { Label } from '../../components/ui/label'
import { NativeSelect, NativeSelectOption } from '../../components/ui/native-select'

interface FilterSelectProps<T extends string> {
  readonly label: string
  readonly value: T | ''
  readonly options: readonly { readonly value: T; readonly label: string }[]
  /** Lo que dice la opción sin filtro. */
  readonly allLabel: string
  readonly onChange: (value: T | '') => void
}

/** Un filtro de lista: cambia al elegir, sin botón de aplicar. */
export default function FilterSelect<T extends string>({ label, value, options, allLabel, onChange }: FilterSelectProps<T>) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id}>{label}</Label>
      <NativeSelect
        id={id}
        value={value}
        onChange={(event) => {
          const elegido = options.find((option) => option.value === event.target.value)
          onChange(elegido?.value ?? '')
        }}
        className="min-w-44"
      >
        <NativeSelectOption value="">{allLabel}</NativeSelectOption>
        {options.map((option) => (
          <NativeSelectOption key={option.value} value={option.value}>
            {option.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  )
}
