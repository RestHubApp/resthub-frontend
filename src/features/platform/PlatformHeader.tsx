import { Link, useLocation, useNavigate } from 'react-router'

import Icon from '../../components/Icon'
import { Button } from '../../components/ui/button'
import { usePlatformSession } from '../../store/platformSession'
import PlatformNav from './PlatformNav'

/**
 * La franja oscura de arriba, en cada pantalla del área de plataforma.
 *
 * Se ve distinta a propósito: el armazón de un restaurante es claro y lleva
 * su nombre; esto dice «Administración del sistema» para que nadie crea que
 * está cargando algo dentro de un local.
 */
export default function PlatformHeader() {
  const admin = usePlatformSession((state) => state.admin)
  const signOut = usePlatformSession((state) => state.signOut)
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const salir = () => {
    signOut()
    void navigate('/plataforma/acceso', { replace: true })
  }

  return (
    <header className="bg-foreground text-background">
      <div className="mx-auto flex w-full max-w-[1100px] flex-wrap items-center gap-x-4 gap-y-2 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 sm:px-6">
        <Link
          to="/plataforma"
          className="inline-flex min-h-11 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-background/60"
        >
          <span className="font-heading text-lg font-black tracking-tight">RestHub</span>
          <span className="rounded-md bg-background/15 px-2 py-1 text-xs font-semibold tracking-wide uppercase">
            Administración del sistema
          </span>
        </Link>
        {admin === null ? null : (
          <>
            <PlatformNav pathname={pathname} />
            <div className="ml-auto flex min-w-0 items-center gap-2">
              <span className="hidden max-w-48 truncate text-sm text-background/90 md:inline">{admin.full_name}</span>
              <Button
                type="button"
                variant="ghost"
                className="h-11 gap-2 px-3 text-background hover:bg-background/10 hover:text-background focus-visible:ring-background/60"
                onClick={salir}
              >
                <Icon name="salir" size={18} />
                <span>Cerrar sesión</span>
              </Button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
