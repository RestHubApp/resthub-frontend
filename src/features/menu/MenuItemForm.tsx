import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { dishCostsQueryKey } from '../../api/inventory'
import { createMenuItem, menuQueryKey, updateMenuItem } from '../../api/menu'
import type { MenuItem, MenuSection } from '../../api/types'
import DialogFormActions from '../../components/DialogFormActions'
import FormMessage from '../../components/FormMessage'
import Icon from '../../components/Icon'
import { Button } from '../../components/ui/button'
import { onSubmit } from '../../hooks/formSubmit'
import { errorMessage } from '../../services/api'
import { withItem } from './menuCache'
import MenuItemFields from './MenuItemFields'
import ModifierGroupsEditor from './ModifierGroupsEditor'
import { draftsOf, type GroupDraft, type ParsedGroup, parseGroups } from './modifierDrafts'
import {
  emptyMenuItem,
  menuItemPayload,
  menuItemSchema,
  type MenuItemValues,
  menuItemValuesOf,
} from './menuSchema'
import { MENU_KEY } from './useMenuData'

interface MenuItemFormProps {
  /** El plato que se edita. Sin él, se crea uno nuevo. */
  readonly item?: MenuItem
  readonly categories: readonly MenuSection[]
  /** La categoría elegida al crear desde una categoría. */
  readonly defaultCategoryId?: number
  readonly onDone: () => void
}

export default function MenuItemForm({
  item,
  categories,
  defaultCategoryId,
  onDone,
}: MenuItemFormProps) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, formState } = useForm<MenuItemValues>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: item === undefined ? emptyMenuItem(defaultCategoryId) : menuItemValuesOf(item),
  })

  const [grupos, setGrupos] = useState<GroupDraft[]>(() => draftsOf(item))
  const [errorGrupos, setErrorGrupos] = useState<string | null>(null)

  const guardar = useMutation({
    mutationFn: (valores: MenuItemValues & { modifier_groups: ParsedGroup[] }) => {
      const cuerpo = { ...menuItemPayload(valores), modifier_groups: valores.modifier_groups }
      // Un plato nuevo entra disponible: se crea para venderlo.
      return item === undefined
        ? createMenuItem({ ...cuerpo, is_available: true })
        : updateMenuItem(item.id, cuerpo)
    },
    onSuccess: (plato) => {
      queryClient.setQueryData(MENU_KEY, (menu) => menu && withItem(menu, plato))
      // La carta del mesero y el margen, que se calcula en el inventario con
      // el precio, se releen de fondo.
      void queryClient.invalidateQueries({ queryKey: menuQueryKey })
      void queryClient.invalidateQueries({ queryKey: dishCostsQueryKey })
      onDone()
    },
  })

  const etiqueta = item === undefined ? 'Crear plato' : 'Guardar'

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={onSubmit(
        handleSubmit((valores) => {
          const opciones = parseGroups(grupos)
          if (!opciones.ok) {
            setErrorGrupos(opciones.error)
            return
          }
          setErrorGrupos(null)
          guardar.mutate({ ...valores, modifier_groups: opciones.value })
        }),
      )}
    >
      <MenuItemFields register={register} errors={formState.errors} categories={categories} />
      <ModifierGroupsEditor groups={grupos} error={errorGrupos} onChange={setGrupos} />

      {guardar.isError ? (
        <FormMessage tone="error">
          {errorMessage(guardar.error, 'No se pudo guardar el plato.')}
        </FormMessage>
      ) : null}

      <DialogFormActions>
        <Button type="button" variant="outline" size="lg" className="h-11 px-4" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" size="lg" className="h-11 px-4" disabled={guardar.isPending}>
          <Icon name={item === undefined ? 'agregar' : 'confirmar'} size={16} />
          <span>{guardar.isPending ? 'Guardando…' : etiqueta}</span>
        </Button>
      </DialogFormActions>
    </form>
  )
}
