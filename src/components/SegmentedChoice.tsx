interface SegmentedChoiceProps<T extends string> {
  /** Lo que se elige; si no se muestra, lo dice igual al lector de pantalla. */
  readonly legend: string
  readonly isLegendVisible?: boolean
  /** Agrupa los botones de radio: único en la pantalla. */
  readonly name: string
  readonly options: readonly { readonly value: T; readonly label: string }[]
  readonly value: T
  readonly onChange: (value: T) => void
  /** `wrap`: cada opción del ancho de su texto; `fill`: reparten el ancho de la fila. */
  readonly layout?: 'wrap' | 'fill'
}

const OPTION =
  'flex min-h-11 min-w-16 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm has-checked:border-primary has-checked:bg-secondary has-checked:font-medium has-checked:text-secondary-foreground has-focus-visible:ring-3 has-focus-visible:ring-ring/50'

/**
 * Pocas opciones excluyentes como botones grandes, controladas por estado.
 *
 * Son botones de radio nativos dentro de un `fieldset`: el lector anuncia la
 * pregunta y la opción, las flechas cambian de una a otra y el dedo toca la
 * etiqueta entera. Para un formulario de react-hook-form está `ChoiceField`.
 */
export function SegmentedChoice<T extends string>({
  legend,
  isLegendVisible = false,
  name,
  options,
  value,
  onChange,
  layout = 'wrap',
}: SegmentedChoiceProps<T>) {
  return (
    <fieldset className="m-0 flex flex-col border-0 p-0">
      <legend className={isLegendVisible ? 'mb-2 text-sm font-medium' : 'sr-only'}>{legend}</legend>
      <div className={`flex gap-2 ${layout === 'fill' ? '[&>*]:flex-1' : 'flex-wrap'}`}>
        {options.map((option) => (
          <label key={option.value} className={OPTION}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              className="sr-only"
              onChange={() => {
                onChange(option.value)
              }}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
