import { StatusBadge } from '@/components/StatusBadge'
import { buttonVariants } from '@/components/ui/button'
import { formatMoney } from '@/services/format'

/**
 * «Así se ve»: una tarjeta de mesa, un botón, una insignia y una línea de texto
 * pintados con los colores, la letra y el tamaño vigentes. Se queda fija arriba
 * mientras se toca un control, así el efecto no se pierde de vista aunque la
 * pantalla sea larga. Es solo para mirar (nada de ella se toca), por eso la
 * lee el lector de pantalla como una sola frase y el botón no recibe foco.
 */
export function AppearancePreview() {
  return (
    <div
      role="img"
      aria-label="Vista previa: la mesa 3 con un pedido servido por cobrar, de 49 soles"
      className="sticky top-[calc(var(--preview-banner-h,0px)+4.25rem)] z-20 flex flex-col gap-1.5 rounded-xl border bg-card p-3 shadow-float lg:top-[calc(var(--preview-banner-h,0px)+0.5rem)]"
    >
      <p className="m-0 text-xs font-medium text-muted-foreground">Así se ve</p>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex flex-col">
            <span className="font-semibold text-card-foreground">Mesa 3</span>
            <span className="text-sm text-muted-foreground">{formatMoney(49)}</span>
          </div>
          <StatusBadge label="Servido, por cobrar" tone="confirmed" />
        </div>
        <span className={buttonVariants({ size: 'sm' })}>Cobrar</span>
      </div>
      <p className="m-0 text-sm text-card-foreground">Ají de gallina para dos, sin ají.</p>
    </div>
  )
}
