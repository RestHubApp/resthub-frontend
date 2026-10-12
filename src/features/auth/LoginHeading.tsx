/** El título del acceso y una línea que dice con qué se entra. */
export function LoginHeading() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="m-0 font-heading text-3xl leading-tight font-bold text-foreground">Iniciar sesión</h1>
      <p className="m-0 text-base leading-relaxed text-muted-foreground">
        Entra con el correo de tu cuenta de RestHub.
      </p>
    </div>
  )
}
