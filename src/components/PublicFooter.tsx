import { Link } from 'react-router'

import { openAccessibilityMenu } from './accessibilityMenu'

// Mismo aspecto para el enlace y el botón: se leen como una sola fila, con 44 px de alto al tacto.
const ITEM =
  'inline-flex min-h-11 cursor-pointer items-center rounded-lg px-2 text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50'

interface PublicFooterProps {
  /** La política con los términos. */
  readonly privacyTo: string
  /** La sección de derechos ARCO dentro de la política. */
  readonly rightsTo: string
}

/**
 * El pie de las pantallas sin sesión (acceso y privacidad).
 *
 * Solo lleva lo que existe: la política con los términos, el atajo a los
 * derechos ARCO dentro de ella y el menú de accesibilidad. No se dibuja con
 * sesión; allí la navegación es la del armazón.
 */
export function PublicFooter({ privacyTo, rightsTo }: PublicFooterProps) {
  return (
    <footer className="flex flex-col gap-1 text-sm text-muted-foreground">
      <nav aria-label="Información legal y accesibilidad">
        <ul className="-mx-2 m-0 flex list-none flex-wrap p-0" role="list">
          <li>
            <Link to={privacyTo} className={ITEM}>
              Privacidad y términos
            </Link>
          </li>
          <li>
            <Link to={rightsTo} className={ITEM}>
              Tus derechos (ARCO)
            </Link>
          </li>
          <li>
            <button type="button" className={ITEM} onClick={openAccessibilityMenu}>
              Accesibilidad
            </button>
          </li>
        </ul>
      </nav>
      <p className="m-0">{`© ${String(new Date().getFullYear())} RestHub`}</p>
    </footer>
  )
}
