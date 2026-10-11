import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router'

import { changeOwnPassword } from '@/api/auth'
import { paths } from '@/services/paths'
import { useSession } from '@/store/session'
import { followWithNewToken } from './changePasswordSession'
import type { ChangePasswordForm } from './passwordSchema'

/**
 * Mutación del cambio de contraseña propia.
 *
 * Al terminar renueva el token (y limpia el formulario con `onRenewed`) o, si
 * la sesión ya no sirve, vuelve al acceso.
 */
export function useChangePassword(onRenewed: () => void) {
  const navigate = useNavigate()

  return useMutation({
    // El token se toma al enviar: si otra pestaña entra con otra cuenta
    // mientras tanto, compararlo al terminar pisaría esa sesión ajena.
    mutationFn: async (values: ChangePasswordForm) => {
      const origin = useSession.getState().token
      const response = await changeOwnPassword({
        current_password: values.current_password,
        new_password: values.new_password,
      })
      return { response, origin }
    },
    onSuccess: ({ response, origin }) => {
      const result = followWithNewToken(response, origin)
      if (result === 'renovada') {
        onRenewed()
      } else if (result === 'cerrada') {
        void navigate(paths.login, { replace: true })
      }
    },
  })
}
