/**
 * El fondo del panel de marca: platos vistos desde arriba, en hilera, como un
 * mantel puesto.
 *
 * Es decorativo y local (sin imagen ni petición): dibuja con el color del
 * texto del panel, así sigue cualquier tema, claro, oscuro o de alto
 * contraste. Se desvanece hacia donde va el texto para no restarle lectura.
 */
export function LoginPattern() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className="pointer-events-none absolute inset-0 size-full text-primary-foreground opacity-[0.14] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
    >
      <defs>
        <pattern id="login-plates" width="132" height="132" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="33" cy="33" r="22" />
            <circle cx="33" cy="33" r="13" />
            <circle cx="99" cy="99" r="22" />
            <circle cx="99" cy="99" r="13" />
          </g>
          <g fill="currentColor">
            <rect x="82" y="14" width="2.5" height="34" rx="1.25" />
            <rect x="90" y="14" width="2.5" height="34" rx="1.25" />
            <rect x="98" y="14" width="2.5" height="34" rx="1.25" />
            <rect x="14" y="84" width="2.5" height="34" rx="1.25" />
            <path d="M126 84c4 6 4 14 0 20v14h-2.5V84z" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#login-plates)" />
    </svg>
  )
}
