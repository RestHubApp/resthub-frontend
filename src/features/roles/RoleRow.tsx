import type { Role } from '../../api/types'
import Icon from '../../components/Icon'
import StatusBadge from '../../components/StatusBadge'
import { Button } from '../../components/ui/button'
import DeleteRoleButton from './DeleteRoleButton'
import { KIND_LABELS, memberCountLabel, type PermissionGroup, permissionSummary } from './permissionGroups'
import type { RoleAccess } from './roleAccess'

interface RoleRowProps {
  readonly role: Role
  readonly groups: readonly PermissionGroup[]
  readonly access: RoleAccess
  readonly onOpen: () => void
}

/** Un rol en la lista: nombre, clase, cuántos lo tienen y qué pueden hacer. */
export default function RoleRow({ role, groups, access, onOpen }: RoleRowProps) {
  const editable = access === 'edit'

  return (
    <li className="flex flex-col gap-3 border-b py-4 last:border-b-0 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-lg font-semibold break-words">{role.name}</span>
          <StatusBadge label={KIND_LABELS[role.kind]} tone={role.kind === 'owner' ? 'confirmed' : undefined} />
        </span>
        <span className="text-sm text-muted-foreground">
          {memberCountLabel(role.member_count)} · {permissionSummary(role, groups)}
        </span>
        {access === 'beyond' ? (
          <span className="text-xs text-muted-foreground">Tiene permisos que tu cuenta no tiene.</span>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-11 px-3"
          aria-label={editable ? `Editar el rol ${role.name}` : `Ver permisos del rol ${role.name}`}
          onClick={onOpen}
        >
          <Icon name={editable ? 'editar' : 'ver'} size={16} />
          <span>{editable ? 'Editar' : 'Ver permisos'}</span>
        </Button>
        {editable && role.is_deletable ? <DeleteRoleButton role={role} /> : null}
      </div>
    </li>
  )
}
