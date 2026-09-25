import Icon from '../../components/Icon'
import { Button } from '../../components/ui/button'

interface RecipeFooterProps {
  /** La receta quedó sin insumos: guardar la borra. */
  readonly empty: boolean
  readonly hadRecipe: boolean
  readonly dirty: boolean
  readonly pending: boolean
}

/** El botón de guardar, que dice qué va a pasar: guardar o borrar la receta. */
export default function RecipeFooter({ empty, hadRecipe, dirty, pending }: RecipeFooterProps) {
  const borra = empty && hadRecipe
  const etiqueta = borra ? 'Borrar receta' : 'Guardar receta'

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
      <p className="m-0 text-sm text-muted-foreground" aria-live="polite">
        {borra ? 'Sin insumos: al guardar, el plato queda sin receta y sin costo.' : ''}
        {!borra && dirty ? 'Hay cambios sin guardar.' : ''}
      </p>
      <Button
        type="submit"
        size="lg"
        variant={borra ? 'danger' : 'default'}
        className="h-11 px-5"
        disabled={pending || !dirty}
      >
        <Icon name={borra ? 'eliminar' : 'confirmar'} size={16} />
        <span>{pending ? 'Guardando…' : etiqueta}</span>
      </Button>
    </div>
  )
}
