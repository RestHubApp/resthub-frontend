import { Link } from 'react-router'

import { openAccessibilityMenu } from './accessibilityMenu'

// Mismo aspecto para el enlace y el botón: se leen como una sola fila, con 44 px de alto al tacto
// (el alto sale del relleno vertical y no se nota: el texto sigue siendo pequeño).
const ITEM =
  'inline-flex min-h-11 cursor-pointer items-center rounded-lg px-3 text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50'

interface PublicFooterProps {
  /** La política con los términos. */
  readonly privacyTo: string
  /** La sección de derechos ARCO dentro de la política. */
  readonly rightsTo: string
}

/**
 * El pie de las pantallas sin sesión (acceso y privacidad).
 *
 * Es una franja del ancho completo de la ventana, con borde fino arriba y el
 * mismo fondo de la página. En la laptop lleva el © a la izquierda y los
 * enlaces a la derecha, en una sola línea; en el celular se centra, con los
 * enlaces arriba (pueden envolver) y el © debajo. A la derecha deja el hueco
 * del botón flotante de accesibilidad (44 px a 1 rem del borde) para no
 * quedar debajo de él.
 *
 * Solo lleva lo que existe: la política con los términos, el atajo a los
 * derechos ARCO dentro de ella y el menú de accesibilidad. No se dibuja con
 * sesión; allí la navegación es la del armazón.
 */
export function PublicFooter({ privacyTo, rightsTo }: PublicFooterProps) {
  return (
    <footer className="w-full border-t border-border bg-background text-sm text-muted-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col-reverse items-center px-4 py-2 sm:flex-row sm:justify-between sm:px-10 sm:pr-20">
        <p className="m-0 pb-3 sm:pb-0">{`© ${String(new Date().getFullYear())} RestHub`}</p>
        <nav aria-label="Información legal y accesibilidad">
          <ul className="m-0 flex list-none flex-wrap justify-center p-0 sm:-mr-3" role="list">
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
      </div>
    </footer>
  )
}
