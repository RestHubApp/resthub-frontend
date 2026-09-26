import { Link, Navigate, useLocation } from 'react-router'

import { Card, CardContent, CardFooter, CardHeader } from '../../components/ui/card'
import { usePlatformSession } from '../../store/platformSession'
import PlatformLoginForm from './PlatformLoginForm'

const INICIO = '/plataforma'

/** Vuelve a la pantalla que se quiso abrir, si era del área de plataforma. */
function destinoDe(estado: unknown): string {
  const desde =
    typeof estado === 'object' && estado !== null && 'from' in estado ? estado.from : undefined
  return typeof desde === 'string' && desde.startsWith(`${INICIO}/`) && desde !== `${INICIO}/acceso`
    ? desde
    : INICIO
}

/**
 * El acceso del administrador del sistema.
 *
 * Es otra puerta que la del personal: las cuentas de plataforma no son de
 * ningún restaurante y su sesión se guarda aparte, así que entrar acá no
 * cierra ni reemplaza la sesión de un local abierta en el mismo navegador.
 */
export default function PlatformLoginView() {
  const admin = usePlatformSession((state) => state.admin)
  const expired = usePlatformSession((state) => state.expired)
  const signIn = usePlatformSession((state) => state.signIn)
  const destino = destinoDe(useLocation().state)

  // Con la sesión abierta, o recién abierta con este formulario, se sigue
  // a la pantalla que se quería abrir.
  if (admin !== null) {
    return <Navigate to={destino} replace />
  }

  return (
    <div className="mx-auto my-auto w-full max-w-md">
      <Card className="w-full gap-6 py-6 shadow-sm">
        <CardHeader className="gap-2 px-6 sm:px-8">
          <h1 className="m-0 font-heading text-2xl leading-tight font-bold text-foreground sm:text-3xl">
            Administración del sistema
          </h1>
          <p className="m-0 text-base text-muted-foreground">
            Solo para el equipo de RestHub. El personal de un restaurante entra por el acceso de siempre.
          </p>
        </CardHeader>
        <CardContent className="px-6 sm:px-8">
          <PlatformLoginForm expired={expired} onSignedIn={signIn} />
        </CardContent>
        <CardFooter className="justify-center px-6 py-4 text-sm sm:px-8">
          <Link
            to="/acceso"
            className="inline-flex min-h-11 items-center rounded-lg px-2 text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Ir al acceso de restaurantes
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
