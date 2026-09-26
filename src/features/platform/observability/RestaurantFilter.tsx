import { useQuery } from '@tanstack/react-query'

import { platformRestaurantsQuery } from '../../../api/platform'
import { Label } from '../../../components/ui/label'
import { NativeSelect, NativeSelectOption } from '../../../components/ui/native-select'

interface RestaurantFilterProps {
  readonly value: number | null
  readonly onChange: (value: number | null) => void
}

// El máximo que da la lista del servidor por página: los 100 más nuevos.
const RESTAURANTES = { limit: 100, offset: 0 } as const

/**
 * Un solo restaurante o todos. Mientras carga la lista, o si falla, sigue
 * ofreciendo «Todos» y el que ya estaba elegido, para no perder el filtro.
 */
export default function RestaurantFilter({ value, onChange }: RestaurantFilterProps) {
  const lista = useQuery(platformRestaurantsQuery(RESTAURANTES))
  const locales = lista.data?.items ?? []
  const falta = value !== null && !locales.some((local) => local.id === value)

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="obs-restaurante">Restaurante</Label>
      <NativeSelect
        id="obs-restaurante"
        className="w-full min-w-56 sm:w-64 [&_select]:h-11"
        value={value === null ? '' : String(value)}
        onChange={(event) => {
          onChange(event.target.value === '' ? null : Number(event.target.value))
        }}
      >
        <NativeSelectOption value="">Todos los restaurantes</NativeSelectOption>
        {falta ? <NativeSelectOption value={String(value)}>{`Restaurante #${String(value)}`}</NativeSelectOption> : null}
        {locales.map((local) => (
          <NativeSelectOption key={local.id} value={String(local.id)}>
            {local.name}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  )
}
