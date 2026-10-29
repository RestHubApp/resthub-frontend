import type { PermissionCode, Session } from '@/api/types'
import { hasPermission } from '@/store/session'

/** Quien puede crear cuentas, cambiar contraseñas o emitir comprobantes: con su contraseña sola, quien la robe tiene mucho. */
const RECOMMENDED_FOR: readonly PermissionCode[] = ['staff.manage', 'billing.manage']

/**
 * A quién se le recomienda la verificación en dos pasos al entrar: al personal
 * con esos permisos. Vive aparte del aviso para que el armazón lo decida sin
 * bajar el aviso; la vista previa y los términos los mira el aviso.
 */
export function recommendsTwoFactor(account: Session): boolean {
  return account.kind === 'staff' && RECOMMENDED_FOR.some((permission) => hasPermission(account, permission))
}
