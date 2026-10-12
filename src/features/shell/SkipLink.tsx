/** El enlace para saltar al contenido principal; solo se ve al enfocarlo con el teclado. */
export function SkipLink() {
  return (
    <a
      href="#contenido"
      className="sr-only rounded-lg bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50"
    >
      Saltar al contenido
    </a>
  )
}
