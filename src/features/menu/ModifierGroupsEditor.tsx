import Icon from '../../components/Icon'
import { Button } from '../../components/ui/button'
import { Checkbox } from '../../components/ui/checkbox'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { emptyGroup, type GroupDraft } from './modifierDrafts'

interface ModifierGroupsEditorProps {
  readonly groups: readonly GroupDraft[]
  readonly error: string | null
  readonly onChange: (groups: GroupDraft[]) => void
}

// El mismo tope que el servidor.
const MAX_GRUPOS = 8

/**
 * Tamaño, término, extras: los grupos de opciones del plato.
 *
 * Cada grupo se escribe como una lista, una opción por línea y su precio
 * adicional después de «=». Un grupo obligatorio no deja enviar el plato sin
 * elegir; el máximo dice cuántas se pueden marcar.
 */
export default function ModifierGroupsEditor({ groups, error, onChange }: ModifierGroupsEditorProps) {
  const cambiar = (indice: number, cambio: Partial<GroupDraft>) => {
    onChange(groups.map((grupo, i) => (i === indice ? { ...grupo, ...cambio } : grupo)))
  }

  return (
    <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
      <legend className="mb-1 text-sm font-medium">Opciones del plato (opcional)</legend>
      {groups.map((grupo, indice) => {
        const id = `grupo-${String(indice)}`
        return (
          <div key={id} className="flex flex-col gap-2 rounded-lg p-3 ring-1 ring-input">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex min-w-40 flex-1 flex-col gap-1.5">
                <Label htmlFor={`${id}-nombre`}>Grupo</Label>
                <Input id={`${id}-nombre`} placeholder="Tamaño, Extras…" maxLength={40} value={grupo.name} onChange={(e) => {
                  cambiar(indice, { name: e.target.value })
                }} />
              </div>
              <div className="flex w-24 flex-col gap-1.5">
                <Label htmlFor={`${id}-max`}>Máximo</Label>
                <Input id={`${id}-max`} inputMode="numeric" value={grupo.max} onChange={(e) => {
                  cambiar(indice, { max: e.target.value })
                }} />
              </div>
              <label className="flex h-9 items-center gap-2 text-sm">
                <Checkbox checked={grupo.required} onCheckedChange={(estado) => {
                  cambiar(indice, { required: estado === true })
                }} />
                Obligatorio
              </label>
              <Button type="button" variant="ghost" size="sm" aria-label={`Quitar el grupo ${grupo.name}`} onClick={() => {
                onChange(groups.filter((_, i) => i !== indice))
              }}>
                <Icon name="eliminar" size={16} />
              </Button>
            </div>
            <Label htmlFor={`${id}-opciones`} className="text-sm text-muted-foreground">
              Una opción por línea; el precio extra después de «=»
            </Label>
            <Textarea id={`${id}-opciones`} rows={3} placeholder={'Personal\nFamiliar = 10.50'} value={grupo.options} onChange={(e) => {
              cambiar(indice, { options: e.target.value })
            }} />
          </div>
        )
      })}
      {error === null ? null : <p role="alert" className="m-0 text-sm text-destructive">{error}</p>}
      {groups.length < MAX_GRUPOS ? (
        <Button type="button" variant="outline" className="self-start" onClick={() => {
          onChange([...groups, emptyGroup()])
        }}>
          <Icon name="agregar" size={16} />
          <span>Agregar grupo de opciones</span>
        </Button>
      ) : null}
    </fieldset>
  )
}
