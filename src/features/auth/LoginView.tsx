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

// Discreto a propósito: es la puerta del equipo de RestHub, no la del
// personal, y lleva a otra sesión que no toca la de este acceso.
const LINK =
  'inline-flex min-h-11 items-center rounded-lg px-2 text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50'
const PLATFORM = (
  <>
    <Link to={paths.privacy} className={LINK}>
      Privacidad
    </Link>
    <Link to={paths.platform.login} className={LINK}>
      Administración del sistema
    </Link>
  </>
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

/** Pantalla de acceso: panel lateral, formulario y enlaces del pie. */
export function LoginView() {
  const destination = destinationOf(useLocation().state)

  // Una pestaña de vista previa no es para entrar con una cuenta real: su
  // sesion se guardaria en la pestaña, no en el navegador.
  if (isPreviewTab()) {
    return <Navigate to={paths.home} replace />
  }

  return (
    <AuthCard title="Iniciar sesión" aside={PANEL} footer={PLATFORM}>
      <LoginForm destination={destination} />
    </AuthCard>
  )
}
