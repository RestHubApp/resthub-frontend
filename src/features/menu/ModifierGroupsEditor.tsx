import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { emptyGroup, type GroupDraft } from './modifierDrafts'

interface ModifierGroupsEditorProps {
  readonly groups: readonly GroupDraft[]
  readonly error: string | null
  readonly onChange: (groups: GroupDraft[]) => void
}

// El mismo tope que el servidor.
const MAX_GROUPS = 8

/**
 * Tamaño, término, extras: los grupos de opciones del plato.
 *
 * Cada grupo se escribe como una lista, una opción por línea y su precio
 * adicional después de «=». Un grupo obligatorio no deja enviar el plato sin
 * elegir; el máximo dice cuántas se pueden marcar.
 */
export function ModifierGroupsEditor({ groups, error, onChange }: ModifierGroupsEditorProps) {
  const change = (index: number, change: Partial<GroupDraft>) => {
    onChange(groups.map((group, i) => (i === index ? { ...group, ...change } : group)))
  }

  return (
    <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
      <legend className="mb-1 text-sm font-medium">Opciones del plato (opcional)</legend>
      {groups.map((group, index) => {
        const id = `grupo-${String(index)}`
        return (
          <div key={id} className="flex flex-col gap-2 rounded-lg p-3 ring-1 ring-input">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex min-w-40 flex-1 flex-col gap-1.5">
                <Label htmlFor={`${id}-nombre`}>Grupo</Label>
                <Input id={`${id}-nombre`} placeholder="Tamaño, Extras…" maxLength={40} value={group.name} onChange={(e) => {
                  change(index, { name: e.target.value })
                }} />
              </div>
              <div className="flex w-24 flex-col gap-1.5">
                <Label htmlFor={`${id}-max`}>Máximo</Label>
                <Input id={`${id}-max`} inputMode="numeric" value={group.max} onChange={(e) => {
                  change(index, { max: e.target.value })
                }} />
              </div>
              <div className="flex h-9 items-center gap-2 text-sm">
                <Checkbox id={`${id}-obligatorio`} checked={group.required} onCheckedChange={(status) => {
                  change(index, { required: status === true })
                }} />
                <Label htmlFor={`${id}-obligatorio`} className="font-normal">Obligatorio</Label>
              </div>
              <Button type="button" variant="ghost" size="sm" aria-label={`Quitar el grupo ${group.name}`} onClick={() => {
                onChange(groups.filter((_, i) => i !== index))
              }}>
                <Icon name="delete" size={16} />
              </Button>
            </div>
            <Label htmlFor={`${id}-opciones`} className="text-sm text-muted-foreground">
              Una opción por línea; el precio extra después de «=»
            </Label>
            <Textarea id={`${id}-opciones`} rows={3} placeholder={'Personal\nFamiliar = 10.50'} value={group.options} onChange={(e) => {
              change(index, { options: e.target.value })
            }} />
          </div>
        )
      })}
      {error === null ? null : <p role="alert" className="m-0 text-sm text-destructive">{error}</p>}
      {groups.length < MAX_GROUPS ? (
        <Button type="button" variant="outline" className="self-start" onClick={() => {
          onChange([...groups, emptyGroup()])
        }}>
          <Icon name="add" size={16} />
          <span>Agregar grupo de opciones</span>
        </Button>
      ) : null}
    </fieldset>
  )
}
