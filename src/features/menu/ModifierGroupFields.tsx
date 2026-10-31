import { Icon } from '@/components/Icon'
import * as icons from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { GroupDraft } from './modifierDrafts'

interface ModifierGroupFieldsProps {
  /** Prefijo de los identificadores de los campos del grupo. */
  readonly id: string
  readonly group: GroupDraft
  readonly onChange: (change: Partial<GroupDraft>) => void
  readonly onRemove: () => void
}

/** Un grupo de opciones del plato: nombre, máximo, obligatorio y la lista de opciones. */
export function ModifierGroupFields({ id, group, onChange, onRemove }: ModifierGroupFieldsProps) {
  return (
    <div className="flex flex-col gap-2 rounded-lg p-3 ring-1 ring-input">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-40 flex-1 flex-col gap-1.5">
          <Label htmlFor={`${id}-nombre`}>Grupo</Label>
          <Input id={`${id}-nombre`} placeholder="Tamaño, Extras…" maxLength={40} value={group.name} onChange={(e) => {
            onChange({ name: e.target.value })
          }} />
        </div>
        <div className="flex w-24 flex-col gap-1.5">
          <Label htmlFor={`${id}-max`}>Máximo</Label>
          <Input id={`${id}-max`} inputMode="numeric" value={group.max} onChange={(e) => {
            onChange({ max: e.target.value })
          }} />
        </div>
        <div className="flex h-9 items-center gap-2 text-sm">
          <Checkbox id={`${id}-obligatorio`} checked={group.required} onCheckedChange={(status) => {
            onChange({ required: status === true })
          }} />
          <Label htmlFor={`${id}-obligatorio`} className="font-normal">Obligatorio</Label>
        </div>
        <Button type="button" variant="ghost" size="sm" aria-label={`Quitar el grupo ${group.name}`} onClick={onRemove}>
          <Icon glyph={icons.delete} size={16} />
        </Button>
      </div>
      <Label htmlFor={`${id}-opciones`} className="text-sm text-muted-foreground">
        Una opción por línea; el precio extra después de «=»
      </Label>
      <Textarea id={`${id}-opciones`} rows={3} placeholder={'Personal\nFamiliar = 10.50'} value={group.options} onChange={(e) => {
        onChange({ options: e.target.value })
      }} />
    </div>
  )
}
