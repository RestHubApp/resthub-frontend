import FormMessage from '../../components/FormMessage'
import Icon from '../../components/Icon'

interface PreviewOpenedNoticeProps {
  /** `encargado` o `mesero`. */
  readonly label: string
  readonly url: string
  /** El código sirve una vez: después de usar el enlace, se quita. */
  readonly onUsed: () => void
}

/**
 * El aviso de que la vista previa se abrió, con un enlace de repuesto.
 *
 * El navegador no dice si bloqueó la pestaña nueva, así que el enlace está
 * siempre, mientras el código siga valiendo.
 */
export default function PreviewOpenedNotice({ label, url, onUsed }: PreviewOpenedNoticeProps) {
  return (
    <div className="flex flex-col items-start gap-2">
      <FormMessage tone="ok">Se abrió la vista previa como {label} en otra pestaña.</FormMessage>
      <p className="m-0 text-sm text-muted-foreground">
        ¿No se abrió? El navegador pudo bloquearla. Ábrela con este enlace: vale un minuto y sirve una sola vez.
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onUsed}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg px-1 font-medium text-primary underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Icon name="ver" size={18} />
        <span>Abrir la vista previa como {label}</span>
      </a>
    </div>
  )
}
