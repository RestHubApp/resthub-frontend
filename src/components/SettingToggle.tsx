import { Checkbox } from './ui/checkbox'

interface SettingToggleProps {
  /** Base de los ids de la casilla, el título y el detalle (únicos en la página). */
  readonly id: string
  readonly title: string
  readonly detail: string
  readonly isChecked: boolean
  readonly isPending: boolean
  readonly onChange: (isChecked: boolean) => void
}

/**
 * Un ajuste que se enciende o se apaga, con su título y lo que implica.
 *
 * La casilla de Radix es un <button>: se nombra con aria-labelledby, porque
 * algunos validadores (WAVE) no toman el texto del <label> que la envuelve, y
 * la etiqueta apunta a la casilla con `htmlFor` en vez de envolverla (un
 * <label> que envuelve un <button> queda «huérfano» para WAVE).
 */
export function SettingToggle({ id, title, detail, isChecked, isPending, onChange }: SettingToggleProps) {
  const titleId = `${id}-titulo`
  const detailId = `${id}-detalle`

  return (
    <div className="flex items-start gap-3 rounded-lg bg-muted px-4 py-3 text-sm">
      <Checkbox
        id={id}
        aria-labelledby={titleId}
        aria-describedby={detailId}
        className="mt-0.5"
        checked={isChecked}
        disabled={isPending}
        onCheckedChange={(status) => {
          onChange(status === true)
        }}
      />
      <label htmlFor={id} className="cursor-pointer">
        <span id={titleId} className="font-medium">{title}</span>
        <span id={detailId} className="block text-muted-foreground">{detail}</span>
      </label>
    </div>
  )
}
