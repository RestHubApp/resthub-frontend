import type { UseFormRegisterReturn } from 'react-hook-form'

import SelectField from '../../components/SelectField'
import TextField from '../../components/TextField'
import { NativeSelectOption } from '../../components/ui/native-select'
import { soloLetras } from '../../services/fieldRules'
import { ROLE_LABELS, ROLE_OPTIONS } from './staffSchema'

interface StaffFieldsProps {
  /** Lo que devuelve `register(...)` para cada campo. */
  readonly fields: {
    readonly full_name: UseFormRegisterReturn
    readonly email: UseFormRegisterReturn
    readonly role: UseFormRegisterReturn
  }
  readonly errors: {
    readonly full_name?: string
    readonly email?: string
    readonly role?: string
  }
  /**
   * El tipo de la cuenta propia, que no se puede cambiar: quien se quita el
   * rol de encargado se queda sin esta pantalla. Con valor, se muestra en vez
   * de la lista.
   */
  readonly lockedRoleLabel?: string
}

/**
 * Los datos de una cuenta del personal, comunes al alta y a la edicion.
 *
 * Recibe los campos ya registrados y no el `register` del formulario: asi el
 * alta, que ademas pide la contraseña, y la edicion, que no, comparten los
 * campos sin compartir el tipo de su formulario.
 */
export default function StaffFields({ fields, errors, lockedRoleLabel }: StaffFieldsProps) {
  const roleLocked = lockedRoleLabel !== undefined

  return (
    <div className="grid items-start gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <TextField
          id="full_name"
          label="Nombre completo"
          placeholder="María Quispe Rojas"
          icon="perfil"
          autoComplete="off"
          sanitize={soloLetras}
          field={fields.full_name}
          error={errors.full_name}
        />
      </div>
      <TextField
        id="email"
        label="Correo"
        placeholder="nombre@correo.com"
        type="email"
        inputMode="email"
        autoComplete="off"
        spellCheck={false}
        hint="Con este correo entra a RestHub."
        field={fields.email}
        error={errors.email}
      />
      {roleLocked ? (
        <div className="flex flex-col gap-2">
          <p className="m-0 text-sm font-medium">Tipo de cuenta</p>
          <p className="m-0 flex min-h-10 items-center text-base">{lockedRoleLabel}</p>
          <p className="m-0 text-xs text-muted-foreground">
            No puedes cambiar el tipo de tu propia cuenta.
          </p>
        </div>
      ) : (
        <SelectField
          id="role"
          label="Tipo de cuenta"
          icon="tipoDeCuenta"
          field={fields.role}
          error={errors.role}
        >
          {ROLE_OPTIONS.map((role) => (
            <NativeSelectOption key={role} value={role}>
              {ROLE_LABELS[role]}
            </NativeSelectOption>
          ))}
        </SelectField>
      )}
    </div>
  )
}
