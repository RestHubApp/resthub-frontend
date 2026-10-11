import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'

import { createCategory, menuQueryKey, updateCategory } from '@/api/menu'
import type { MenuCategory } from '@/api/types'
import { DialogFormActions } from '@/components/DialogFormActions'
import { FormMessage } from '@/components/FormMessage'
import { Icon } from '@/components/Icon'
import { TextField } from '@/components/TextField'
import { Button } from '@/components/ui/button'
import { onSubmit } from '@/hooks/formSubmit'
import { errorMessage } from '@/services/api'
import { withCategory } from './menuCache'
import { type CategoryValues, categorySchema } from './menuSchema'
import { MENU_KEY } from './useMenuData'

interface CategoryFormProps {
  /** La categoría que se edita. Sin ella, se crea una nueva. */
  readonly category?: MenuCategory
  readonly onDone: () => void
}

export function CategoryForm({ category, onDone }: CategoryFormProps) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, formState } = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: category?.name ?? '' },
  })

  const save = useMutation({
    mutationFn: (values: CategoryValues) =>
      category === undefined ? createCategory(values) : updateCategory(category.id, values),
    onSuccess: (createdCategory) => {
      queryClient.setQueryData(MENU_KEY, (menu) => menu && withCategory(menu, createdCategory))
      void queryClient.invalidateQueries({ queryKey: menuQueryKey })
      onDone()
    },
  })

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={onSubmit(
        handleSubmit((values) => {
          save.mutate(values)
        }),
      )}
    >
      <TextField
        id="category-name"
        label="Nombre"
        placeholder="Entradas, Segundos, Bebidas…"
        autoComplete="off"
        field={register('name')}
        error={formState.errors.name?.message}
      />

      {save.isError ? (
        <FormMessage tone="error">
          {errorMessage(save.error, 'No se pudo guardar la categoría.')}
        </FormMessage>
      ) : null}

      <DialogFormActions>
        <Button type="button" variant="outline" size="lg" className="h-11 px-4" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" size="lg" className="h-11 px-4" disabled={save.isPending}>
          <Icon name={category === undefined ? 'add' : 'confirm'} size={16} />
          <span>{save.isPending ? 'Guardando…' : 'Guardar'}</span>
        </Button>
      </DialogFormActions>
    </form>
  )
}
