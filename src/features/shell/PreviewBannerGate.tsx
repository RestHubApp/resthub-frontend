import type { Session } from '@/api/types'
import { PreviewBanner } from './PreviewBanner'

/** Muestra el aviso de la vista previa solo cuando la sesión es de vista previa (siempre del personal del local de muestra). */
export function PreviewBannerGate({ account }: { readonly account: Session }) {
  return account.kind === 'staff' && account.preview ? <PreviewBanner account={account} /> : null
}
