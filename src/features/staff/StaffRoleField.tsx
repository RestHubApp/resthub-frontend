import type { UseFormRegisterReturn } from 'react-hook-form'

import type { Role } from '@/api/types'
import { ReadOnlyField } from '@/components/ReadOnlyField'
import { SelectField } from '@/components/SelectField'
import { NativeSelectOption } from '@/components/ui/native-select'
import * as icons from '@/components/icons'

interface StaffRoleFieldProps {
  readonly field: UseFormRegisterReturn
  readonly error?: string | undefined
  /** Los roles que quien mira puede dar. */
  readonly roles: readonly Role[]
  /** El rol de la cuenta propia, que no se puede cambiar: se muestra en vez de la lista. */
  readonly lockedRoleLabel?: string | undefined
}

/** El rol de una cuenta del personal: una lista para elegir o, en la cuenta propia, solo el rol. */
export function StaffRoleField({ field, error, roles, lockedRoleLabel }: StaffRoleFieldProps) {
  if (lockedRoleLabel !== undefined) {
    return (
      <ReadOnlyField
        label="Rol"
        value={lockedRoleLabel}
        hint="No puedes cambiar el rol de tu propia cuenta."
      />
    )
  }
  return (
    <SelectField
      id="role_id"
      label="Rol"
      icon={icons.accountType}
      hint="Solo aparecen los roles con permisos que tu cuenta también tiene."
      field={field}
      error={error}
    >
      {roles.map((role) => (
        <NativeSelectOption key={role.id} value={String(role.id)}>
          {role.name}
        </NativeSelectOption>
      ))}
    </SelectField>
  )
}
