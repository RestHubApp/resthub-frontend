import { Navigate, useLocation } from 'react-router'

import { paths } from '@/services/paths'
import { isPreviewTab } from '@/services/tabStorage'
import { LoginForm } from './LoginForm'
import { LoginHeading } from './LoginHeading'
import { LoginLayout } from './LoginLayout'

/**
 * A dónde ir después de entrar.
 *
 * La guarda de rutas deja la pantalla que se quiso abrir: quien vuelve tras una
 * sesión vencida sigue donde estaba en vez de empezar desde el inicio.
 */
function destinationOf(status: unknown): string {
  const from =
    typeof status === 'object' && status !== null && 'from' in status ? status.from : undefined
  return typeof from === 'string' && from.startsWith('/') && from !== paths.login ? from : paths.home
}

/**
 * Pantalla de acceso, la única: la misma para el personal de un restaurante y
 * para el equipo de RestHub. El servidor decide qué cuenta es; la interfaz solo
 * muestra lo que sus permisos dejan.
 */
export function LoginView() {
  const destination = destinationOf(useLocation().state)

  // Una pestaña de vista previa no es para entrar con una cuenta real: su
  // sesion se guardaria en la pestaña, no en el navegador.
  if (isPreviewTab()) {
    return <Navigate to={paths.home} replace />
  }

  return (
    <LoginLayout>
      <LoginHeading />
      <LoginForm destination={destination} />
      <p className="m-0 text-sm leading-relaxed text-muted-foreground">
        Tu cuenta la crea el encargado del restaurante. Si olvidaste tu contraseña, pídele que la restablezca.
      </p>
    </LoginLayout>
  )
}
