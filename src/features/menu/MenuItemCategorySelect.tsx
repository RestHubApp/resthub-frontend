import type { UseFormRegister } from 'react-hook-form'

import type { MenuSection } from '@/api/types'
import { SelectField } from '@/components/SelectField'
import { NativeSelectOption } from '@/components/ui/native-select'
import type { MenuItemValues } from './menuSchema'

interface MenuItemCategorySelectProps {
  readonly register: UseFormRegister<MenuItemValues>
  readonly error: string | undefined
  readonly categories: readonly MenuSection[]
}

/** La lista de categorías de un plato; las inactivas se marcan como tales. */
export function MenuItemCategorySelect({ register, error, categories }: MenuItemCategorySelectProps) {
  return (
    <SelectField
      id="item-category"
      label="Categoría"
      icon="dishMenu"
      placeholder="Elige una categoría"
      field={register('category_id')}
      error={error}
    >
      {categories.map((category) => (
        <NativeSelectOption key={category.id} value={String(category.id)}>
          {category.is_active ? category.name : `${category.name} (inactiva)`}
        </NativeSelectOption>
      ))}
    </SelectField>
  )
}
