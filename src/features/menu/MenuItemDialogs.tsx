import type { MenuItem, MenuSection } from '@/api/types'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { FormDialog } from '@/components/FormDialog'
import { MenuItemForm } from './MenuItemForm'

/** Qué ventana de un plato está abierta: editarlo, confirmar que sale de la carta o ninguna. */
export type MenuItemDialog = 'edit' | 'deactivate' | null

interface MenuItemDialogsProps {
  readonly item: MenuItem
  readonly categories: readonly MenuSection[]
  readonly dialog: MenuItemDialog
  readonly onDialog: (dialog: MenuItemDialog) => void
  readonly onDeactivate: () => void
}

/** Las ventanas de un plato: el formulario de edición y la confirmación de sacarlo de la carta. */
export function MenuItemDialogs({ item, categories, dialog, onDialog, onDeactivate }: MenuItemDialogsProps) {
  return (
    <>
      <FormDialog
        open={dialog === 'edit'}
        onOpenChange={(isOpen) => {
          onDialog(isOpen ? 'edit' : null)
        }}
        title={`Editar ${item.name}`}
        size="lg"
      >
        <MenuItemForm
          item={item}
          categories={categories}
          onDone={() => {
            onDialog(null)
          }}
        />
      </FormDialog>
      <ConfirmDialog
        open={dialog === 'deactivate'}
        onOpenChange={(isOpen) => {
          onDialog(isOpen ? 'deactivate' : null)
        }}
        title={`¿Sacar ${item.name} de la carta?`}
        description="El mesero deja de verlo hasta que lo vuelvas a activar. Si solo no hay hoy, usa «Disponible hoy»."
        confirmLabel="Desactivar"
        onConfirm={onDeactivate}
      />
    </>
  )
}
