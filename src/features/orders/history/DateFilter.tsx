import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'

interface DateFilterProps {
  readonly id: string
  readonly label: string
  readonly value: string
  readonly onChange: (value: string) => void
}

export default function DateFilter({ id, label, value, onChange }: DateFilterProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="date"
        className="h-11"
        value={value}
        onChange={(event) => {
          onChange(event.target.value)
        }}
      />
    </div>
  )
}
