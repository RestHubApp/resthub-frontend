import type { PermissionCode } from '@/api/types'
import { useSession } from '@/store/session'
import { entriesFor, type NavEntry } from './navigation'
import { useShellScreens } from './shellScreens'

const WITHOUT_PERMISSIONS: readonly PermissionCode[] = []

/** Las entradas del menú que los permisos de la cuenta con sesión dejan abrir, en el orden de fábrica. */
export function useAccountEntries(): readonly NavEntry[] {
  const permissions = useSession((state) => state.account?.permissions ?? WITHOUT_PERMISSIONS)
  return entriesFor(useShellScreens(), permissions)
}
