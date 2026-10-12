import type { UseFormRegisterReturn } from 'react-hook-form'

import type { Role } from '@/api/types'
import { TextField } from '@/components/TextField'
import { onlyLetters } from '@/services/fieldRules'
import { StaffEmailField } from './StaffEmailField'
import { StaffRoleField } from './StaffRoleField'

interface StaffFieldsProps {
  /** Lo que devuelve `register(...)` para cada campo. */
  readonly fields: {
    readonly full_name: UseFormRegisterReturn
    readonly role_id: UseFormRegisterReturn
    /** Solo al crear. Al editar, el correo se muestra y no se cambia. */
    readonly email?: UseFormRegisterReturn
  }
  readonly errors: {
    readonly full_name?: string | undefined
    readonly email?: string | undefined
    readonly role_id?: string | undefined
  }
  /** Los roles que quien mira puede dar. */
  readonly roles: readonly Role[]
  /** El correo de una cuenta que ya existe. */
  readonly fixedEmail?: string | undefined
  /**
   * El rol de la cuenta propia, que no se puede cambiar: quien se quita el
   * permiso de administrar el personal se queda sin esta pantalla. Con valor,
   * se muestra en vez de la lista.
   */
  readonly lockedRoleLabel?: string | undefined
}

/**
 * Los datos de una cuenta del personal, comunes al alta y a la edicion.
 *
 * Recibe los campos ya registrados y no el `register` del formulario: asi el
 * alta, que ademas pide la contraseña, y la edicion, que no, comparten los
 * campos sin compartir el tipo de su formulario.
 */
export function StaffFields({
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
          icon="profile"
          autoComplete="off"
          sanitize={onlyLetters}
          field={fields.full_name}
          error={errors.full_name}
        />
      </div>
      <StaffEmailField field={fields.email} error={errors.email} fixedEmail={fixedEmail} />
      <StaffRoleField field={fields.role_id} error={errors.role_id} roles={roles} lockedRoleLabel={lockedRoleLabel} />
    </div>
  )
}
