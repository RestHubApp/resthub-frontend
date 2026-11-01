import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'

import { twoFactorQuery } from '@/api/twoFactor'
import type { Session } from '@/api/types'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { paths } from '@/services/paths'
import { useSignInTip } from '@/store/signInTip'
import { recommendsTwoFactor } from './twoFactorReminderRule'

/** Si la cuenta ya aceptó los términos y el tratamiento de sus datos. */
function isSettled(account: Session): boolean {
  return account.kind !== 'staff' || (account.terms_accepted && account.privacy_accepted)
}

/**
 * Al entrar, recomienda activar la verificación en dos pasos (RFS-22) a quien
 * administra el personal o la facturación y todavía no la usa. Es opcional: el
 * aviso se cierra con «Ahora no» y no vuelve hasta la próxima vez que entre.
 * El armazón lo baja solo cuando hace falta (`ShellOverlays`).
 */
export function TwoFactorReminder({ account }: { readonly account: Session }) {
  const isPending = useSignInTip((state) => state.pending)
  const dismiss = useSignInTip((state) => state.dismiss)
  const navigate = useNavigate()
  // Después de aceptar los términos: «Antes de empezar» se ve dentro del armazón y va primero.
  const isCandidate = isPending && recommendsTwoFactor(account) && !account.preview && isSettled(account)
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
