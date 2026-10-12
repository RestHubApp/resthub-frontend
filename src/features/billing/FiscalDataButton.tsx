import { Icon } from '@/components/Icon'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'

interface FiscalDataButtonProps {
  /** Falta algo para enviar a SUNAT: el botón lo dice para que lo obligatorio no se vuelva invisible. */
  readonly isIncomplete: boolean
  readonly onClick: () => void
}

/** El botón de la cabecera que abre los datos fiscales. */
export function FiscalDataButton({ isIncomplete, onClick }: FiscalDataButtonProps) {
  return (
    <Button type="button" variant="outline" onClick={onClick}>
      <Icon name="settings" size={16} />
      <span>Datos fiscales</span>
      {isIncomplete ? <StatusBadge label="Falta completar" tone="pending" /> : null}
    </Button>
  )
}
