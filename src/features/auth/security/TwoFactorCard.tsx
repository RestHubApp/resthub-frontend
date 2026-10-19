import { useState } from 'react'

import type { TwoFactorStatus } from '@/api/types'
import { Icon } from '@/components/Icon'
import { RetryQueryError } from '@/components/RetryQueryError'
import { SectionCard } from '@/components/SectionCard'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { TwoFactorEnabledActions } from './TwoFactorEnabledActions'
import { TwoFactorSheet } from './TwoFactorSheet'
import { useTwoFactor } from './useTwoFactor'

function statusText(status: TwoFactorStatus): string {
  if (!status.enabled) return 'Al entrar, además de la contraseña, se pide un código de tu celular. Así nadie entra solo con tu contraseña.'
  const left = status.recovery_codes_left
  const remaining = left === 1 ? 'queda 1 código' : 'quedan ' + String(left) + ' códigos'
  return `Al entrar se pide el código de tu aplicación. Te ${remaining} de recuperación.`
}

/**
 * La verificación en dos pasos de la cuenta propia (RFS-22). Sin `canDisable`
 * (la administración del sistema, que la tiene obligatoria) no se ofrece apagarla.
 */
export function TwoFactorCard({ canDisable }: { readonly canDisable: boolean }) {
  const twoFactor = useTwoFactor()
  const { status, begin, confirm, renew, disable } = twoFactor
  const [isOpen, setIsOpen] = useState(false)
  const open = (start: () => void) => {
    begin.reset(); confirm.reset(); renew.reset()
    start()
    setIsOpen(true)
  }
  const isEnabled = status.data?.enabled === true

  return (
    <SectionCard title="Verificación en dos pasos" description={status.data === undefined ? undefined : statusText(status.data)}>
      {status.isError ? <RetryQueryError error={status.error} fallback="No se pudo leer la verificación en dos pasos." onRetry={() => { void status.refetch() }} /> : null}
      {status.isSuccess ? (
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge label={isEnabled ? 'Activa' : 'Sin activar'} tone={isEnabled ? 'completed' : undefined} />
          {isEnabled ? (
            <TwoFactorEnabledActions
              canDisable={canDisable}
              isDisabling={disable.isPending}
              onRenew={() => { open(() => { renew.mutate() }) }}
              onDisable={() => { disable.mutate() }}
            />
          ) : (
            <Button type="button" onClick={() => { open(() => { begin.mutate() }) }}>
              <Icon name="key" size={16} />
              <span>Activar</span>
            </Button>
          )}
        </div>
      ) : null}
      <TwoFactorSheet open={isOpen} twoFactor={twoFactor} onClose={() => { setIsOpen(false) }} />
    </SectionCard>
  )
}
