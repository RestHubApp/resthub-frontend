/** Lo que se ve mientras la pestaña nueva canjea el código de vista previa. */
export default function PreviewEntryPending() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4">
      <p role="status" className="m-0 text-base text-muted-foreground">
        Abriendo la vista previa…
      </p>
    </main>
  )
}
