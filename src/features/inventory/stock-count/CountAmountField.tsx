import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface CountAmountFieldProps {
  readonly id: string
  readonly label: string
  readonly value: string
  readonly onChange: (value: string) => void
  readonly isInvalid?: boolean
  readonly describedBy?: string | undefined
}

/** Un número de la línea, con el teclado numérico del celular. */
export function CountAmountField({ id, label, value, onChange, isInvalid = false, describedBy }: CountAmountFieldProps) {
  return (
    <div className="flex min-w-32 flex-1 flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        inputMode="decimal"
        autoComplete="off"
        value={value}
        aria-invalid={isInvalid}
        aria-describedby={describedBy}
        onChange={(event) => {
          onChange(event.target.value)
        }}
      />
    </div>
  )
}
