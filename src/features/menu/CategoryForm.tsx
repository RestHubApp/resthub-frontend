import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import type { MenuCategory } from '@/api/types'
import { FormMessage } from '@/components/FormMessage'
import { TextField } from '@/components/TextField'
import { onSubmit } from '@/hooks/formSubmit'
import { errorMessage } from '@/services/apiError'
import { MenuFormActions } from './MenuFormActions'
import { type CategoryValues, categorySchema } from './menuSchema'
import { useSaveCategory } from './useSaveCategory'

interface CategoryFormProps {
  /** La categoría que se edita. Sin ella, se crea una nueva. */
  readonly category?: MenuCategory
  readonly onDone: () => void
}

export function CategoryForm({ category, onDone }: CategoryFormProps) {
  const { register, handleSubmit, formState } = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: category?.name ?? '' },
  })
  const save = useSaveCategory(category, onDone)

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

      <MenuFormActions
        icon={category === undefined ? 'add' : 'confirm'}
        submitLabel="Guardar"
        isPending={save.isPending}
        onCancel={onDone}
      />
    </form>
  )
}
