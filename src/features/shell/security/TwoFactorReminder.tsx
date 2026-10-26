import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'

import { twoFactorQuery } from '@/api/twoFactor'
import type { PermissionCode, Session } from '@/api/types'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { paths } from '@/services/paths'
import { hasPermission } from '@/store/session'
import { useSignInTip } from '@/store/signInTip'

/** Quien puede crear cuentas, cambiar contraseñas o emitir comprobantes: con su contraseña sola, quien la robe tiene mucho. */
const RECOMMENDED_FOR: readonly PermissionCode[] = ['staff.manage', 'billing.manage']

/**
 * A quién se le recomienda: al personal (no a una vista previa) con esos
 * permisos, y después de aceptar los términos, porque «Antes de empezar» se ve
 * dentro del armazón y va primero.
 */
function shouldRecommend(account: Session): boolean {
  if (account.kind !== 'staff' || account.preview || !account.terms_accepted || !account.privacy_accepted) return false
  return RECOMMENDED_FOR.some((permission) => hasPermission(account, permission))
}

/**
 * Al entrar, recomienda activar la verificación en dos pasos (RFS-22) a quien
 * administra el personal o la facturación y todavía no la usa. Es opcional: el
 * aviso se cierra con «Ahora no» y no vuelve hasta la próxima vez que entre.
 */
export function TwoFactorReminder({ account }: { readonly account: Session }) {
  const isPending = useSignInTip((state) => state.pending)
  const dismiss = useSignInTip((state) => state.dismiss)
  const navigate = useNavigate()
  const isCandidate = isPending && shouldRecommend(account)
  // Si no se puede leer, no se recomienda nada: es un consejo, no un paso obligatorio.
  const status = useQuery({ ...twoFactorQuery, enabled: isCandidate, meta: { background: true } })

  if (!isCandidate || status.data === undefined || status.data.enabled) return null
  return (
    <ConfirmDialog
      open
      onOpenChange={(isOpen) => {
        if (!isOpen) dismiss()
      }}
      title="Protege tu cuenta con la verificación en dos pasos"
      description="Además de la contraseña, al entrar se pide un código de tu celular. Así, aunque alguien la descubra, no puede entrar como tú ni tocar el personal o los comprobantes del local. Te recomendamos activarla."
      confirmLabel="Activarla ahora"
      cancelLabel="Ahora no"
      confirmVariant="default"
      onConfirm={() => {
        dismiss()
        void navigate(paths.profile)
      }}
    />
  )
}
