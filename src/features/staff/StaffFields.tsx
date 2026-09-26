import type { UseFormRegisterReturn } from 'react-hook-form'

import type { Role } from '../../api/types'
import ReadOnlyField from '../../components/ReadOnlyField'
import SelectField from '../../components/SelectField'
import TextField from '../../components/TextField'
import { NativeSelectOption } from '../../components/ui/native-select'
import { soloLetras } from '../../services/fieldRules'

interface StaffFieldsProps {
  /** Lo que devuelve `register(...)` para cada campo. */
  readonly fields: {
    readonly full_name: UseFormRegisterReturn
    readonly role_id: UseFormRegisterReturn
    /** Solo al crear. Al editar, el correo se muestra y no se cambia. */
    readonly email?: UseFormRegisterReturn
  }
  readonly errors: {
    readonly full_name?: string
    readonly email?: string
    readonly role_id?: string
  }
  /** Los roles que quien mira puede dar. */
  readonly roles: readonly Role[]
  /** El correo de una cuenta que ya existe. */
  readonly fixedEmail?: string
  /**
   * El rol de la cuenta propia, que no se puede cambiar: quien se quita el
   * permiso de administrar el personal se queda sin esta pantalla. Con valor,
   * se muestra en vez de la lista.
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
export default function StaffFields({
  fields,
  errors,
  roles,
  fixedEmail,
  lockedRoleLabel,
}: StaffFieldsProps) {
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
      {fields.email === undefined ? (
        <ReadOnlyField
          label="Correo"
          value={fixedEmail ?? ''}
          hint="Es con lo que entra a RestHub: no se cambia."
        />
      ) : (
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
      )}
      {lockedRoleLabel !== undefined ? (
        <ReadOnlyField
          label="Rol"
          value={lockedRoleLabel}
          hint="No puedes cambiar el rol de tu propia cuenta."
        />
      ) : (
        <SelectField
          id="role_id"
          label="Rol"
          icon="tipoDeCuenta"
          hint="Solo aparecen los roles con permisos que tu cuenta también tiene."
          field={fields.role_id}
          error={errors.role_id}
        >
          {roles.map((role) => (
            <NativeSelectOption key={role.id} value={String(role.id)}>
              {role.name}
            </NativeSelectOption>
          ))}
        </SelectField>
      )}
    </div>
  )
}
