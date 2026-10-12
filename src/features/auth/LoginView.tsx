import { Link, Navigate, useLocation } from 'react-router'

import { paths } from '@/services/paths'
import { isPreviewTab } from '@/services/tabStorage'
import { AuthAside } from './AuthAside'
import { AuthCard } from './AuthCard'
import { LoginForm } from './LoginForm'

const PANEL = (
  <AuthAside
    title="Tu restaurante, sin libreta"
    items={[
      { icon: 'order', text: 'Toma los pedidos desde el celular, mesa por mesa o para llevar.' },
      { icon: 'board', text: 'La cocina ve qué preparar y la caja sabe qué cobrar.' },
      { icon: 'indicators', text: 'Ventas, inventario y lo que más se pide, al día.' },
    ]}
    note="Tu cuenta la crea el encargado del restaurante. Si olvidaste tu contraseña, pídele que la restablezca."
  />
)

const FOOTER = (
  <Link
    to={paths.privacy}
    className="inline-flex min-h-11 items-center rounded-lg px-2 text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
  >
    Privacidad
  </Link>
)

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
    <AuthCard title="Iniciar sesión" aside={PANEL} footer={FOOTER}>
      <LoginForm destination={destination} />
    </AuthCard>
  )
}
