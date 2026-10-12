import type { UseFormRegisterReturn } from 'react-hook-form'

interface ChoiceFieldProps {
  readonly legend: string
  readonly field: UseFormRegisterReturn
  readonly options: readonly { readonly value: string; readonly label: string }[]
}

const OPTION =
  'flex min-h-11 flex-1 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm has-checked:border-primary has-checked:bg-secondary has-checked:font-medium has-checked:text-secondary-foreground has-focus-visible:ring-3 has-focus-visible:ring-ring/50'

/**
 * Pocas opciones excluyentes, todas a la vista.
 *
 * Son botones de radio nativos dentro de un `fieldset`: el lector de pantalla
 * anuncia la pregunta y la opción, y las flechas del teclado cambian de una a
 * otra. La etiqueta entera se puede tocar.
 */
export function ChoiceField({ legend, field, options }: ChoiceFieldProps) {
  return (
    <fieldset className="m-0 flex flex-col border-0 p-0">
      <legend className="mb-2 text-sm font-medium">{legend}</legend>
      <div className="flex flex-col gap-2 sm:flex-row">
        {options.map((option) => (
          <label key={option.value} className={OPTION}>
            <input type="radio" value={option.value} className="size-4 accent-primary" {...field} />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
