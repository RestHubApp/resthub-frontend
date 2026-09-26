import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'

interface FilterTextFieldProps {
  readonly id: string
  readonly name: string
  readonly label: string
  readonly value: string
  readonly onChange: (value: string) => void
  readonly maxLength: number
  readonly placeholder?: string
  readonly type?: 'search' | 'text'
}

/**
 * Un filtro de texto que se aplica al enviar el formulario, no con cada letra:
 * cada búsqueda es una lectura del servidor.
 */
export default function FilterTextField({
  id,
  name,
  label,
  value,
  onChange,
  maxLength,
  placeholder,
  type = 'text',
}: FilterTextFieldProps) {
  return (
    <div className="flex min-w-0 flex-1 basis-56 flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        type={type}
        className="h-11"
        value={value}
        onChange={(event) => {
          onChange(event.target.value)
        }}
        maxLength={maxLength}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
      />
    </div>
  )
}
