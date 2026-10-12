import { useId } from 'react'

import { Label } from './ui/label'
import { NativeSelect, NativeSelectOption } from './ui/native-select'

interface FilterSelectProps<T extends string> {
  readonly label: string
  readonly value: T | ''
  readonly options: readonly { readonly value: T; readonly label: string }[]
  /** Lo que dice la opción sin filtro; sin él, la lista solo trae las opciones dadas. */
  readonly allLabel?: string
  readonly onChange: (value: T | '') => void
  /** Clases extra del contenedor, por ejemplo para ocupar la fila entera en el celular. */
  readonly className?: string
  /** Para quien necesita un id estable (una prueba, un enlace); por omisión se genera. */
  readonly id?: string
}

/**
 * Un filtro de lista con su etiqueta visible: cambia al elegir, sin botón de aplicar.
 *
 * Es la única lista de filtros del producto (historial, decisiones de la IA,
 * registros de la plataforma). El valor vacío es «sin filtro».
 */
export function FilterSelect<T extends string>({
  label,
  value,
  options,
  allLabel,
  onChange,
  className = '',
  id,
}: FilterSelectProps<T>) {
  const generatedId = useId()
  const selectId = id ?? generatedId

  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <Label htmlFor={selectId}>{label}</Label>
      <NativeSelect
        id={selectId}
        value={value}
        className="w-full min-w-40"
        onChange={(event) => {
          const selected = options.find((option) => option.value === event.target.value)
          onChange(selected?.value ?? '')
        }}
      >
        {allLabel === undefined ? null : <NativeSelectOption value="">{allLabel}</NativeSelectOption>}
        {options.map((option) => (
          <NativeSelectOption key={option.value} value={option.value}>
            {option.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  )
}
