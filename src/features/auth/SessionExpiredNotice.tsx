import { FormMessage } from '@/components/FormMessage'
import { useSession } from '@/store/session'

/**
 * Explica por qué se volvió al acceso cuando la sesión se cerró sin que la
 * persona pulsara «Cerrar sesión»: venció sola o se cambió la contraseña.
 *
 * Sin este aviso, quien tenía una pantalla abierta ve el formulario de acceso
 * de golpe y no sabe si hizo algo mal.
 */
export function SessionExpiredNotice() {
  const expired = useSession((state) => state.expired)
  const passwordChanged = useSession((state) => state.passwordChanged)

  return (
    <>
      <div hidden={!expired}>
        <FormMessage tone="error">Tu sesión venció. Vuelve a entrar para seguir donde estabas.</FormMessage>
      </div>
      <div hidden={!passwordChanged}>
        <FormMessage tone="ok">Tu contraseña cambió. Vuelve a iniciar sesión.</FormMessage>
      </div>
    </>
  )
}
