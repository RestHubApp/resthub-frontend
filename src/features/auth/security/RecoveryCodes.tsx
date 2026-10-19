import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { saveFile } from '@/services/download'
import { useNotifications } from '@/store/notifications'

interface RecoveryCodesProps {
  readonly codes: readonly string[]
  readonly onDone: () => void
}

/** `abcde-fghjk`: en dos grupos se copian a mano sin perderse. */
function grouped(code: string): string {
  return code.length > 5 ? `${code.slice(0, 5)}-${code.slice(5)}` : code
}

/**
 * Los códigos de recuperación, que se muestran una sola vez (RFS-22). Cada uno
 * sirve para entrar una vez sin el celular; hay que guardarlos fuera de RestHub.
 */
export function RecoveryCodes({ codes, onDone }: RecoveryCodesProps) {
  const push = useNotifications((state) => state.push)
  const text = codes.map((code) => grouped(code)).join('\n')
  const copy = () => {
    void navigator.clipboard.writeText(text).then(
      () => { push({ tone: 'info', message: 'Códigos copiados.' }) },
      () => { push({ tone: 'warning', message: 'No se pudieron copiar: descárgalos o anótalos.' }) },
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="m-0">
        Guarda estos códigos en un lugar seguro, fuera de este dispositivo. Si pierdes el celular, cada uno te deja entrar una vez. No se vuelven a mostrar.
      </p>
      <ul aria-label="Códigos de recuperación" className="m-0 grid list-none grid-cols-2 gap-2 rounded-md bg-muted p-3 font-mono text-base">
        {codes.map((code) => <li key={code}>{grouped(code)}</li>)}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={copy}>
          <span>Copiar</span>
        </Button>
        <Button type="button" variant="outline" onClick={() => { saveFile(new Blob([`${text}\n`], { type: 'text/plain' }), 'resthub-codigos-de-recuperacion.txt') }}>
          <Icon name="download" size={16} />
          <span>Descargar</span>
        </Button>
        <Button type="button" onClick={onDone}>
          <Icon name="confirm" size={16} />
          <span>Ya los guardé</span>
        </Button>
      </div>
    </div>
  )
}
