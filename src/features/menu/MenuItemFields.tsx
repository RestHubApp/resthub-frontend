import type { FieldErrors, UseFormRegister } from 'react-hook-form'

import type { MenuSection } from '../../api/types'
import SelectField from '../../components/SelectField'
import TextareaField from '../../components/TextareaField'
import TextField from '../../components/TextField'
import { NativeSelectOption } from '../../components/ui/native-select'
import type { MenuItemValues } from './menuSchema'

interface MenuItemFieldsProps {
  readonly register: UseFormRegister<MenuItemValues>
  readonly errors: FieldErrors<MenuItemValues>
  readonly categories: readonly MenuSection[]
}

/** Nombre, precio, categoría y descripción de un plato. */
export default function MenuItemFields({ register, errors, categories }: MenuItemFieldsProps) {
  return (
    <div className="grid items-start gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <TextField
          id="item-name"
          label="Nombre"
          placeholder="Ceviche clásico"
          autoComplete="off"
          field={register('name')}
          error={errors.name?.message}
        />
      </div>
      <TextField
        id="item-price"
        label="Precio (S/)"
        placeholder="28.00"
        icon="precio"
        inputMode="decimal"
        autoComplete="off"
        hint="Con punto o coma para los céntimos."
        field={register('price')}
        error={errors.price?.message}
      />
      <SelectField
        id="item-category"
        label="Categoría"
        icon="carta"
        placeholder="Elige una categoría"
        field={register('category_id')}
        error={errors.category_id?.message}
      >
        {categories.map((categoria) => (
          <NativeSelectOption key={categoria.id} value={String(categoria.id)}>
            {categoria.is_active ? categoria.name : `${categoria.name} (inactiva)`}
          </NativeSelectOption>
        ))}
      </SelectField>
      <div className="sm:col-span-2">
        <TextareaField
          id="item-description"
          label="Descripción (opcional)"
          icon="descripcion"
          placeholder="Pescado del día, leche de tigre, camote y choclo."
          hint="La lee el mesero para contestar qué lleva el plato."
          field={register('description')}
          error={errors.description?.message}
        />
      </div>
    </div>
  )
}
