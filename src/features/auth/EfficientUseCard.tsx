import { SectionCard } from '@/components/SectionCard'
import { Button } from '@/components/ui/button'

// Cada consejo es algo que la aplicación ya hace bien si se usa así.
const TIPS = [
  'Usa una sola pestaña de RestHub: cada pestaña abierta vuelve a descargar sus propios datos.',
  'Instálala en el celular («Agregar a la pantalla de inicio»): abre más rápido y reutiliza lo que ya descargó.',
  'Sin señal, no repitas un pedido: queda guardado en el celular y se envía solo al volver la conexión.',
  'Busca y filtra en vez de recorrer listas largas: así se descarga solo lo que necesitas.',
  'En pantallas OLED, el modo oscuro gasta menos batería; lo eliges en Apariencia.',
] as const

interface EfficientUseCardProps {
  /** El formulario de comentarios; sin él no se ofrece el enlace. */
  readonly feedbackFormUrl?: string | undefined
}

/** Consejos de uso que ahorran datos y batería, y el canal para avisar si algo va lento. */
export function EfficientUseCard({ feedbackFormUrl }: EfficientUseCardProps) {
  return (
    <SectionCard title="Uso eficiente" description="Hábitos que ahorran datos, batería y energía.">
      <ul className="m-0 flex list-disc flex-col gap-2 pl-5 text-sm">
        {TIPS.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
      {feedbackFormUrl === undefined ? null : (
        <div className="flex flex-col gap-3">
          <p className="m-0 text-sm text-muted-foreground">
            ¿Algo va lento, pesa mucho o gasta batería? Cuéntanos: con tus comentarios decidimos qué mejorar.
          </p>
          <div>
            <Button asChild variant="outline">
              <a href={feedbackFormUrl} target="_blank" rel="noopener noreferrer">
                Enviar un comentario
                <span className="sr-only"> (se abre en otra pestaña)</span>
              </a>
            </Button>
          </div>
        </div>
      )}
    </SectionCard>
  )
}
