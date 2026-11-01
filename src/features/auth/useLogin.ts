import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router'

import { login, sessionOf } from '@/api/auth'
import { useSession } from '@/store/session'
import { useSignInTip } from '@/store/signInTip'

/**
 * Mutación de acceso con correo y contraseña.
 *
 * Al entrar abre la sesión y va a `destination`, reemplazando el historial, y
 * deja pendiente la recomendación de la verificación en dos pasos (`signInTip`).
 */
export function useLogin(destination: string) {
  const signIn = useSession((state) => state.signIn)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: login,
    // La respuesta ya trae la cuenta, el restaurante y los permisos: la sesion
    // se abre sin pedir `/auth/me` aparte.
    onSuccess: (response) => {
      signIn(response.access_token, sessionOf(response))
      useSignInTip.getState().arm()
      void navigate(destination, { replace: true })
    },
  })
}
