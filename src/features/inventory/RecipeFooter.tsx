import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'

interface RecipeFooterProps {
  /** La receta quedó sin insumos: guardar la borra. */
  readonly empty: boolean
  readonly hadRecipe: boolean
  readonly dirty: boolean
  readonly pending: boolean
}

const DELETE_ACTION = {
  label: 'Borrar receta',
  variant: 'danger',
  icon: 'delete',
  notice: 'Sin insumos: al guardar, el plato queda sin receta y sin costo.',
} as const

const SAVE_ACTION = { label: 'Guardar receta', variant: 'default', icon: 'confirm', notice: '' } as const

/** El aviso bajo el botón: qué pasa al guardar, o que hay cambios pendientes. */
function noticeOf(isDeleting: boolean, dirty: boolean): string {
  if (isDeleting) {
    return DELETE_ACTION.notice
  }
  return dirty ? 'Hay cambios sin guardar.' : ''
}

/** El botón de guardar, que dice qué va a pasar: guardar o borrar la receta. */
export function RecipeFooter({ empty, hadRecipe, dirty, pending }: RecipeFooterProps) {
  const isDeleting = empty && hadRecipe
  const action = isDeleting ? DELETE_ACTION : SAVE_ACTION

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
      <p className="m-0 text-sm text-muted-foreground" aria-live="polite">
        {noticeOf(isDeleting, dirty)}
      </p>
      <Button type="submit" size="lg" variant={action.variant} className="h-11 px-5" disabled={pending || !dirty}>
        <Icon name={action.icon} size={16} />
        <span>{pending ? 'Guardando…' : action.label}</span>
      </Button>
    </div>
  )
}
