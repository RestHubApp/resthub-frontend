import { type Control, Controller } from 'react-hook-form'

import { usePermissions } from '@/store/session'
import type { PermissionGroup } from './permissionGroups'
import { PermissionPicker } from './PermissionPicker'
import type { RoleValues } from './roleSchema'

interface RolePermissionsFieldProps {
  readonly control: Control<RoleValues>
  readonly groups: readonly PermissionGroup[]
  readonly readOnly: boolean
}

/** El campo de permisos del formulario de rol: solo se pueden dar los que quien edita tiene. */
export function RolePermissionsField({ control, groups, readOnly }: RolePermissionsFieldProps) {
  const granted = usePermissions()

  return (
    <Controller
      control={control}
      name="permissions"
      render={({ field }) => (
        <PermissionPicker
          groups={groups}
          selected={field.value}
          onChange={field.onChange}
          granted={granted}
          readOnly={readOnly}
        />
      )}
    />
  )
}
