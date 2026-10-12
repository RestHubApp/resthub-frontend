import type { MenuSection } from '@/api/types'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { FormDialog } from '@/components/FormDialog'
import { CategoryForm } from './CategoryForm'

/** Qué ventana de una categoría está abierta: editarla, confirmar su desactivación o su eliminación, o ninguna. */
export type CategoryDialog = 'edit' | 'deactivate' | 'delete' | null

interface CategoryDialogsProps {
  readonly category: MenuSection
  readonly dialog: CategoryDialog
  readonly onDialog: (dialog: CategoryDialog) => void
  readonly onDeactivate: () => void
  readonly onDelete: () => void
}

/** Las ventanas de una categoría: el formulario de edición y las dos confirmaciones. */
export function CategoryDialogs({ category, dialog, onDialog, onDeactivate, onDelete }: CategoryDialogsProps) {
  const change = (kind: Exclude<CategoryDialog, null>) => (isOpen: boolean) => {
    onDialog(isOpen ? kind : null)
  }

  return (
    <>
      <FormDialog open={dialog === 'edit'} onOpenChange={change('edit')} title={`Editar ${category.name}`}>
        <CategoryForm
          category={category}
          onDone={() => {
            onDialog(null)
          }}
        />
      </FormDialog>
      <ConfirmDialog
        open={dialog === 'deactivate'}
        onOpenChange={change('deactivate')}
        title={`¿Desactivar ${category.name}?`}
        description="La categoría y sus platos dejan de verse en la carta del mesero. No se borra nada: puedes volver a activarla."
        confirmLabel="Desactivar"
        onConfirm={onDeactivate}
      />
      <ConfirmDialog
        open={dialog === 'delete'}
        onOpenChange={change('delete')}
        title={`¿Eliminar ${category.name}?`}
        description="La categoría está vacía y se borra para siempre."
        confirmLabel="Eliminar"
        onConfirm={onDelete}
      />
    </>
  )
}
