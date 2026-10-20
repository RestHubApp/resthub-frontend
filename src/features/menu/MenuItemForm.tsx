import { zodResolver } from '@hookform/resolvers/zod'

import type { MenuItem, MenuSection } from '@/api/types'
import { FormFooter } from '@/components/FormFooter'
import { onSubmit } from '@/hooks/formSubmit'
import { useAppForm } from '@/hooks/useAppForm'
import { MenuItemFields } from './MenuItemFields'
import { ModifierGroupsEditor } from './ModifierGroupsEditor'
import {
  emptyMenuItem,
  menuItemSchema,
  type MenuItemValues,
  menuItemValuesOf,
} from './menuSchema'
import { useModifierGroups } from './useModifierGroups'
import { useSaveMenuItem } from './useSaveMenuItem'

interface MenuItemFormProps {
  /** El plato que se edita. Sin él, se crea uno nuevo. */
  readonly item?: MenuItem
  readonly categories: readonly MenuSection[]
  /** La categoría elegida al crear desde una categoría. */
  readonly defaultCategoryId?: number | undefined
  readonly onDone: () => void
}

export function MenuItemForm({
  item,
  categories,
  defaultCategoryId,
  onDone,
}: MenuItemFormProps) {
  const { register, handleSubmit, formState } = useAppForm<MenuItemValues>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: item === undefined ? emptyMenuItem(defaultCategoryId) : menuItemValuesOf(item),
  })

  const modifiers = useModifierGroups(item)
  const save = useSaveMenuItem(item, onDone)

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={onSubmit(
        handleSubmit((values) => {
          const groups = modifiers.collect()
          if (groups !== null) {
            save.mutate({ ...values, modifier_groups: groups })
          }
        }),
      )}
    >
      <MenuItemFields register={register} errors={formState.errors} categories={categories} />
      <ModifierGroupsEditor groups={modifiers.groups} error={modifiers.error} onChange={modifiers.setGroups} />

      <FormFooter
        mutation={save}
        failureText="No se pudo guardar el plato."
        onCancel={onDone}
        submit={{ label: item === undefined ? 'Crear plato' : 'Guardar', icon: item === undefined ? 'add' : 'confirm' }}
      />
    </form>
  )
}
