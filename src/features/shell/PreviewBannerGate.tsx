import type { CurrentUserResponse } from '@/api/types'
import { usePreview } from '@/store/session'
import { PreviewBanner } from './PreviewBanner'

/** Muestra el aviso de la vista previa solo cuando la sesión es de vista previa. */
export function PreviewBannerGate({ account }: { readonly account: CurrentUserResponse }) {
  const isPreview = usePreview()
  return isPreview ? <PreviewBanner account={account} /> : null
}
