import { useState } from 'react'

import { ConfirmDialog } from '@/components/ConfirmDialog'
import { FormDialog } from '@/components/FormDialog'
import { Icon } from '@/components/Icon'
import { SectionCard } from '@/components/SectionCard'
import { Button } from '@/components/ui/button'
import { PinForm } from './PinForm'
import { usePinSettings } from './usePinSettings'

function lockText(minutes: number): string {
  return minutes > 0
    ? `Si nadie usa la pantalla por ${String(minutes)} minutos, la sesión se bloquea.`
    : 'Tu restaurante no bloquea la sesión por inactividad, pero puedes bloquearla a mano.'
}

/**
 * El PIN de desbloqueo y el bloqueo a mano (RFS-29). Con un PIN se desbloquea
 * más rápido que con la contraseña; sin él, se usa la contraseña.
 */
export function PinCard() {
  const { account, choose, remove, lockNow } = usePinSettings()
  const [isOpen, setIsOpen] = useState(false)
  if (account === null) return null
  const hasPin = account.has_pin
  const minutes = typeof account.idle_lock_minutes === 'number' ? account.idle_lock_minutes : 0

  return (
    <SectionCard
      title="Bloqueo de la sesión"
      description={`${lockText(minutes)} ${hasPin ? 'La desbloqueas con tu PIN.' : 'Sin PIN, la desbloqueas con tu contraseña.'}`}
    >
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => { setIsOpen(true) }}>
          <Icon name="key" size={16} />
          <span>{hasPin ? 'Cambiar PIN' : 'Elegir un PIN'}</span>
        </Button>
        {hasPin ? (
          <ConfirmDialog
            trigger={<Button type="button" variant="outline" disabled={remove.isPending}>Quitar PIN</Button>}
            title="¿Quitar el PIN?"
            description="La sesión bloqueada se abrirá con tu contraseña."
            confirmLabel="Quitar PIN"
            onConfirm={() => { remove.mutate() }}
          />
        ) : null}
        <Button type="button" variant="outline" onClick={lockNow}>
          <Icon name="lock" size={16} />
          <span>Bloquear ahora</span>
        </Button>
      </div>
      <FormDialog open={isOpen} onOpenChange={setIsOpen} title={hasPin ? 'Cambiar PIN' : 'Elegir un PIN'}>
        <PinForm mutation={{ ...choose, mutate: (pin) => { choose.mutate(pin, { onSuccess: () => { setIsOpen(false) } }) } }} onCancel={() => { setIsOpen(false) }} />
      </FormDialog>
    </SectionCard>
  )
}
