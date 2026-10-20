import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'

import { reauthenticate } from '@/api/accountSecurity'
import { hasCode } from '@/services/apiError'
import type { CurrentPasswordValues } from '@/services/securityRules'

/** Cómo terminó un envío: confirmada, o el servidor pide además el código de dos pasos. */
type Outcome = 'confirmed' | 'code-required'

/**
 * El envío de «Confirma tu contraseña». Si la cuenta usa la verificación en
 * dos pasos, el servidor responde 401 `two_factor_required`: desde ahí se pide
 * el código y viaja con la contraseña. Ese pedido no es un fallo (la ventana
 * no muestra su aviso de respaldo); un código equivocado
 * (`invalid_two_factor_code`) sí, con el mensaje del servidor.
 */
export function useReauthenticationConfirm(onConfirmed: () => void) {
  const [code, setCode] = useState('')
  const [isAskingCode, setIsAskingCode] = useState(false)
  const confirm = useMutation({
    mutationFn: async (values: CurrentPasswordValues): Promise<Outcome> => {
      try {
        await reauthenticate(values.password, isAskingCode && code !== '' ? code : undefined)
        return 'confirmed'
      } catch (error) {
        if (hasCode(error, 'two_factor_required')) return 'code-required'
        throw error
      }
    },
    onSuccess: (outcome) => {
      if (outcome === 'confirmed') onConfirmed()
      else setIsAskingCode(true)
    },
    onError: (error) => {
      if (hasCode(error, 'invalid_two_factor_code')) setIsAskingCode(true)
    },
  })
  return { confirm, isAskingCode, setCode }
}
