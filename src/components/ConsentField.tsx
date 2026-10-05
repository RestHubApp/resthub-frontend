import FieldError from './FieldError'
import { fieldIds } from './fieldIds'
import { Checkbox } from './ui/checkbox'

/**
 * Lo que se le lee o muestra al cliente antes de guardarlo en la libreta (Ley
 * N.º 29733). Si cambia, cambia también `CONSENT_VERSION` en el backend
 * (`customers/domain/customers.py`): lo aceptado antes queda con su versión.
 */
export const CONSENT_TEXT =
  'El cliente acepta que el local guarde sus datos (nombre, teléfono, correo, dirección y notas, ' +
  'incluidas alergias) para atender sus próximos pedidos. Puede pedir verlos, corregirlos o ' +
  'borrarlos cuando quiera (Ley N.º 29733).'

interface ConsentFieldProps {
  readonly id: string
  readonly checked: boolean
  readonly onChange: (checked: boolean) => void
  readonly error?: string
}

/**
 * La casilla del consentimiento informado del cliente.
 *
 * Como en `PermissionOption`: va dentro de un formulario, donde Radix agrega un
 * <input> oculto junto a su <button>. La etiqueta envuelve la casilla para
 * nombrar también ese <input> (si no, WAVE lo da sin etiqueta), y el botón se
 * nombra con `aria-labelledby`. Tocar el texto también la marca: en el celular
 * no hace falta atinarle al cuadrito.
 */
export default function ConsentField({ id, checked, onChange, error }: ConsentFieldProps) {
  const { errorId, describedBy } = fieldIds(id, undefined, error)
  const textoId = `${id}-texto`
  return (
    <div className="flex flex-col gap-1">
      <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md border border-input p-3 text-sm">
        <Checkbox
          id={id}
          className="mt-0.5"
          checked={checked}
          onCheckedChange={(valor) => {
            onChange(valor === true)
          }}
          aria-labelledby={textoId}
          aria-invalid={error === undefined ? undefined : true}
          aria-describedby={describedBy}
        />
        <span id={textoId}>{CONSENT_TEXT}</span>
      </label>
      <FieldError id={errorId} message={error} />
    </div>
  )
}
