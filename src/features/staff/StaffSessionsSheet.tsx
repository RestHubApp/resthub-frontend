import type { StaffResponse } from '@/api/types'
import { DetailSheet } from '@/components/DetailSheet'
import { Button } from '@/components/ui/button'
import { StaffSessionsBody } from './StaffSessionsBody'
import { useStaffSessions } from './useStaffSessions'

interface StaffSessionsSheetProps {
  readonly account: StaffResponse
  readonly open: boolean
  readonly onClose: () => void
}

/**
 * Dónde tiene la sesión abierta una persona del personal (RFS-17). Si perdió
 * el celular o dejó la sesión abierta en otra computadora, el encargado la
 * cierra desde aquí; la cuenta sigue activa y puede volver a entrar.
 */
export function StaffSessionsSheet({ account, open, onClose }: StaffSessionsSheetProps) {
  const model = useStaffSessions(account, open)
  const { lines, closeAll } = model
  const footer = lines.length > 0 ? (
    <Button type="button" variant="outline" disabled={closeAll.isPending} onClick={() => { closeAll.mutate() }}>
      {closeAll.isPending ? 'Cerrando…' : 'Cerrar todas'}
    </Button>
  ) : undefined

  return (
    <DetailSheet
      open={open}
      onOpenChange={(isOpen) => { if (!isOpen) onClose() }}
      title={`Sesiones de ${account.full_name}`}
      description="Los dispositivos donde su cuenta está abierta ahora."
      footer={footer}
    >
      <StaffSessionsBody account={account} model={model} />
    </DetailSheet>
  )
}
