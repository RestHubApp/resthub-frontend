import { FieldError } from '@/components/FieldError'
import { Icon } from '@/components/Icon'
import * as icons from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { DAY_NAMES, type PeriodDraft, periodProblem } from './openingHours'

interface OpeningPeriodRowProps {
  readonly draft: PeriodDraft
  readonly onChange: (draft: PeriodDraft) => void
  readonly onRemove: () => void
}

/** Un tramo del horario: el día, la apertura y el cierre (si es antes, cierra de madrugada). */
export function OpeningPeriodRow({ draft, onChange, onRemove }: OpeningPeriodRowProps) {
  const id = `horario-${String(draft.key)}`
  const problem = periodProblem(draft)
  const dayName = DAY_NAMES[draft.day] ?? ''
  const errorId = problem === undefined ? undefined : `${id}-error`

  return (
    <li className="flex flex-col gap-1">
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-dia`}>Día</Label>
          <NativeSelect id={`${id}-dia`} value={String(draft.day)} onChange={(event) => { onChange({ ...draft, day: Number(event.target.value) }) }}>
            {DAY_NAMES.map((name, day) => <NativeSelectOption key={name} value={String(day)}>{name}</NativeSelectOption>)}
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-abre`}>Abre</Label>
          <Input id={`${id}-abre`} type="time" step="900" className="w-32" value={draft.opens} aria-invalid={problem !== undefined} aria-describedby={errorId} onChange={(event) => { onChange({ ...draft, opens: event.target.value }) }} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-cierra`}>Cierra</Label>
          <Input id={`${id}-cierra`} type="time" step="900" className="w-32" value={draft.closes} aria-invalid={problem !== undefined} aria-describedby={errorId} onChange={(event) => { onChange({ ...draft, closes: event.target.value }) }} />
        </div>
        <Button type="button" variant="ghost" size="icon" aria-label={`Quitar el tramo del ${dayName.toLowerCase()} de ${draft.opens} a ${draft.closes}`} onClick={onRemove}>
          <Icon glyph={icons.delete} size={16} />
        </Button>
      </div>
      <FieldError id={`${id}-error`} message={problem} />
    </li>
  )
}
