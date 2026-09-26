import { Label } from '../../../components/ui/label'
import { NativeSelect, NativeSelectOption } from '../../../components/ui/native-select'

interface FilterSelectProps {
  readonly id: string
  readonly label: string
  readonly value: string
  readonly options: readonly { readonly value: string; readonly label: string }[]
  readonly onChange: (value: string) => void
}

/** Un filtro de lista que se aplica al elegir. */
export default function FilterSelect({ id, label, value, options, onChange }: FilterSelectProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <NativeSelect
        id={id}
        className="w-full min-w-40 [&_select]:h-11"
        value={value}
        onChange={(event) => {
          onChange(event.target.value)
        }}
      >
        {options.map((option) => (
          <NativeSelectOption key={option.value} value={option.value}>
            {option.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  )
}
