import type { UseFormRegisterReturn } from 'react-hook-form'

import type { Role } from '../../api/types'
import ReadOnlyField from '../../components/ReadOnlyField'
import TextField from '../../components/TextField'
import { MAX_ROLE_NAME } from './roleSchema'

interface RoleNameFieldProps {
  /** `null` para un rol nuevo. */
  readonly role: Role | null
  readonly readOnly: boolean
  readonly field: UseFormRegisterReturn
  readonly error?: string
}

/** El nombre del rol; el del mesero y el de un rol que solo se mira no se escriben. */
export default function RoleNameField({ role, readOnly, field, error }: RoleNameFieldProps) {
  if (role !== null && readOnly) {
    return <ReadOnlyField label="Nombre" value={role.name} hint="Este rol no se puede cambiar." />
  }
  if (role?.kind === 'waiter') {
    return (
      <ReadOnlyField
        label="Nombre"
        value={role.name}
        hint="Es el rol base del mesero: su nombre no cambia, sus permisos sí."
      />
    )
  }
  return (
    <TextField
      id="rol-nombre"
      label="Nombre"
      placeholder="Cocina, Caja, Delivery…"
      icon="roles"
      autoComplete="off"
      maxLength={MAX_ROLE_NAME}
      field={field}
      error={error}
    />
  )
}
