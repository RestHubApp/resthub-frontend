import { useMutation } from '@tanstack/react-query'

import { reauthenticate } from '@/api/accountSecurity'
import { useTwoFactorCode } from '@/hooks/useTwoFactorCode'
import { hasCode } from '@/services/apiError'
import type { CurrentPasswordValues } from '@/services/securityRules'
import { adoptRotatedToken } from '@/store/session'

/** Cómo terminó un envío: confirmada, o el servidor pide además el código de dos pasos. */
type Outcome = 'confirmed' | 'code-required'

/**
 * El envío de «Confirma tu contraseña». Si la cuenta usa la verificación en
 * dos pasos, el servidor responde 401 `two_factor_required`: desde ahí se pide
 * el código y viaja con la contraseña. Ese pedido no es un fallo (la ventana
 * no muestra su aviso de respaldo); un código equivocado
 * (`invalid_two_factor_code`) sí, con el mensaje del servidor.
 */
/**
 * Verifica la contraseña (y el código, si va) sin cambiar nada guardado en
 * caché: la cuenta sigue siendo la misma, con un token nuevo, y se abre la
 * ventana de unos minutos para las acciones críticas.
 */
async function verifyPassword(password: string, code: string | undefined): Promise<Outcome> {
  try {
    adoptRotatedToken(await reauthenticate(password, code))
    return 'confirmed'
  } catch (error) {
    if (hasCode(error, 'two_factor_required')) return 'code-required'
    throw error
  }
}

export function useReauthenticationConfirm(onConfirmed: () => void) {
  const twoFactor = useTwoFactorCode()
  const confirm = useMutation({
    mutationFn: (values: CurrentPasswordValues) => verifyPassword(values.password, twoFactor.isAskingCode ? twoFactor.code : undefined),
    onSuccess: (outcome) => {
      if (outcome === 'confirmed') onConfirmed()
      else twoFactor.askCode()
    },
    onError: (error) => {
      if (hasCode(error, 'invalid_two_factor_code')) twoFactor.askCode()
    },
  })
  // Con el código pedido y vacío, el envío no sale: el campo dice que falta.
  const submit = (values: CurrentPasswordValues) => {
    if (!twoFactor.isMissing()) confirm.mutate(values)
  }
  return { confirm, submit, twoFactor }
}
