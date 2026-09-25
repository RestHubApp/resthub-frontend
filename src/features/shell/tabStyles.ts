// Las clases de cada casillero de la barra inferior. Las comparten los enlaces
// y el boton "Más", que no es un enlace pero tiene que verse igual.
export const TAB =
  'flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-xs font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50'

// La pantalla actual se marca con fondo y no solo con color: se distingue
// igual a pleno sol y sin distinguir tonos.
export const TAB_ACTIVE = `${TAB} bg-secondary font-semibold text-secondary-foreground`
export const TAB_IDLE = `${TAB} text-muted-foreground hover:text-foreground`
