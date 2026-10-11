import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { ModifierGroupFields } from './ModifierGroupFields'
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
      {groups.map((group, index) => (
        <ModifierGroupFields
          key={`grupo-${String(index)}`}
          id={`grupo-${String(index)}`}
          group={group}
          onChange={(partial) => {
            change(index, partial)
          }}
          onRemove={() => {
            onChange(groups.filter((_, i) => i !== index))
          }}
        />
      ))}
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
