import type { Session } from '@/api/types'
import { paths } from '@/services/paths'
import { scopeName, spokenScope } from './accountLabels'
import { Brand } from './Brand'
import { ScopeName } from './ScopeName'

/** La cabecera del celular: la marca y el nombre del restaurante (o la administración del sistema). En pantallas anchas se oculta. */
export function SignedInHeader({ account }: { readonly account: Session }) {
  return (
    <header className="sticky top-[var(--preview-banner-h,0px)] z-30 flex items-center gap-3 border-b bg-card px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 lg:hidden">
      <Brand to={paths.home} compact />
      <ScopeName name={scopeName(account)} variant="header" spokenLabel={spokenScope(account)} />
    </header>
  )
}
