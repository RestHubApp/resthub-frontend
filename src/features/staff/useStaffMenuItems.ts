import { useNavigate } from 'react-router'

import { PERMISSION } from '@/api/permissions'
import type { StaffResponse } from '@/api/types'
import type { ActionsMenuItem } from '@/components/ActionsMenu'
import * as icons from '@/components/icons'
import { paths } from '@/services/paths'
import { useCan } from '@/store/session'
import type { StaffDialog } from './StaffRowDialogs'
import type { useStaffStatus } from './useStaffStatus'

interface MenuItemsOptions {
  readonly account: StaffResponse
  readonly isSelf: boolean
  readonly open: (dialog: StaffDialog) => void
  readonly activate: () => void
  /** Quien mira puede abrir la bitácora: se ofrece «Ver movimientos». */
  readonly canSeeActivity: boolean
  readonly seeActivity: () => void
}

/** «Ver movimientos» para todas; sesiones, contraseña y activar o desactivar no existen para la cuenta propia (las suyas están en Mi perfil). */
function menuItems({ account, isSelf, open, activate, canSeeActivity, seeActivity }: MenuItemsOptions): ActionsMenuItem[] {
  const movements: ActionsMenuItem[] = canSeeActivity
    ? [{ label: 'Ver movimientos', icon: icons.schedule, onSelect: seeActivity }]
    : []
  if (isSelf) {
    return movements
  }
  return [
    ...movements,
    { label: 'Sesiones abiertas', icon: icons.deviceMode, onSelect: () => { open('sesiones') } },
    { label: 'Accesos', icon: icons.history, onSelect: () => { open('accesos') } },
    { label: 'Contraseña', icon: icons.key, onSelect: () => { open('contrasena') } },
    account.is_active
      ? { label: 'Desactivar', icon: icons.turnOn, onSelect: () => { open('desactivar') }, isDestructive: true }
      : { label: 'Activar', icon: icons.turnOn, onSelect: activate },
  ]
}

interface MenuOptions {
  readonly account: StaffResponse
  readonly isSelf: boolean
  readonly open: (dialog: StaffDialog) => void
  readonly status: ReturnType<typeof useStaffStatus>
}

/** Los ítems del menú «⋯» de la fila: «Ver movimientos» solo para quien puede abrir la bitácora. */
export function useStaffMenuItems({ account, isSelf, open, status }: MenuOptions): ActionsMenuItem[] {
  const navigate = useNavigate()
  const canSeeActivity = useCan(PERMISSION.activityRead)
  return menuItems({
    account,
    isSelf,
    open,
    activate: () => {
      status.mutate()
    },
    canSeeActivity,
    seeActivity: () => {
      void navigate(paths.activityLogOfPerson(account.id))
    },
  })
}
