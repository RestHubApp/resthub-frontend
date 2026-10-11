import type { PermissionCode } from '@/api/types'
import type { PermissionGroup } from './permissionGroups'
import { togglePermission } from './permissionGroups'
import { PermissionOption } from './PermissionOption'

interface PermissionPickerProps {
  readonly groups: readonly PermissionGroup[]
  readonly selected: readonly PermissionCode[]
  readonly onChange: (selected: PermissionCode[]) => void
  /** Los permisos de quien mira: solo esos se pueden dar. */
  readonly granted: readonly PermissionCode[]
  readonly readOnly: boolean
}

/** Los permisos del rol, en casillas agrupadas como las ordena el servidor. */
export function PermissionPicker({
  groups,
  selected,
  onChange,
  granted,
  readOnly,
}: PermissionPickerProps) {
  const marked = new Set(selected)
  const available = new Set(granted)
  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0">
      <legend className="mb-1 text-sm font-medium">Permisos</legend>
      {readOnly ? null : (
        <p className="m-0 text-xs text-muted-foreground">
          Quien tenga este rol podrá hacer lo que marques. Los permisos que tu cuenta no tiene aparecen apagados.
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {groups.map((group) => (
          <fieldset key={group.name} className="m-0 min-w-0 rounded-lg border px-3 pt-1 pb-2">
            <legend className="px-1 text-sm font-semibold">{group.name}</legend>
            <ul className="m-0 flex list-none flex-col p-0">
              {group.permissions.map((permission) => (
                <PermissionOption
                  key={permission.code}
                  permission={permission}
                  checked={marked.has(permission.code)}
                  missing={!available.has(permission.code)}
                  readOnly={readOnly}
                  onCheckedChange={(marked) => {
                    onChange(togglePermission(selected, permission.code, marked))
                  }}
                />
              ))}
            </ul>
          </fieldset>
        ))}
      </div>
    </fieldset>
  )
}
