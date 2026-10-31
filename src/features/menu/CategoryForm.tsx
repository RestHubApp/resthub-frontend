import { zodResolver } from '@hookform/resolvers/zod'

import type { MenuCategory } from '@/api/types'
import { FormFooter } from '@/components/FormFooter'
import { TextField } from '@/components/TextField'
import * as icons from '@/components/icons'
import { onSubmit } from '@/hooks/formSubmit'
import { useAppForm } from '@/hooks/useAppForm'
import { type CategoryValues, categorySchema } from './menuSchema'
import { useSaveCategory } from './useSaveCategory'

interface CategoryFormProps {
  /** La categoría que se edita. Sin ella, se crea una nueva. */
  readonly category?: MenuCategory
  readonly onDone: () => void
}

export function CategoryForm({ category, onDone }: CategoryFormProps) {
  const { register, handleSubmit, formState } = useAppForm<CategoryValues>({
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

      <FormFooter
        mutation={save}
        failureText="No se pudo guardar la categoría."
        onCancel={onDone}
        submit={{ label: 'Guardar', icon: category === undefined ? icons.add : icons.confirm }}
      />
    </form>
  )
}
