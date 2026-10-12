import type { MenuSection } from '@/api/types'
import { FormDialog } from '@/components/FormDialog'
import { CategoryForm } from './CategoryForm'
import { MenuItemForm } from './MenuItemForm'

/**
 * Qué ventana de alta está abierta: una categoría nueva, o un plato nuevo en
 * una categoría (o sin elegir, desde el botón general).
 */
export type NewMenuDialog =
  | { readonly type: 'categoria' }
  | { readonly type: 'plato'; readonly categoryId?: number }
  | null

interface NewMenuDialogsProps {
  readonly dialog: NewMenuDialog
  readonly categories: readonly MenuSection[]
  readonly onClose: () => void
}

/** Las ventanas para crear una categoría o un plato. */
export function NewMenuDialogs({ dialog, categories, onClose }: NewMenuDialogsProps) {
  return (
    <>
      <FormDialog open={dialog?.type === 'categoria'} onOpenChange={onClose} title="Nueva categoría">
        <CategoryForm onDone={onClose} />
      </FormDialog>
      <FormDialog
        open={dialog?.type === 'plato'}
        onOpenChange={onClose}
        title="Nuevo plato"
        description="Entra disponible. Después puedes agregarle su receta para conocer su margen."
        size="lg"
      >
        <MenuItemForm
          categories={categories}
          defaultCategoryId={dialog?.type === 'plato' ? dialog.categoryId : undefined}
          onDone={onClose}
        />
      </FormDialog>
    </>
  )
}
