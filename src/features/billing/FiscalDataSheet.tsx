import { useState } from 'react'

import type { BillingSettings } from '@/api/types'
import { DetailSheet } from '@/components/DetailSheet'
import { BillingReadiness } from './BillingReadiness'
import { BillingSettingsForm } from './BillingSettingsForm'
import { CertificateForm } from './CertificateForm'

interface FiscalDataSheetProps {
  readonly settings: BillingSettings
  readonly open: boolean
  readonly onOpenChange: (isOpen: boolean) => void
  /** Al guardar los datos fiscales la hoja se cierra; al subir el certificado, no. */
  readonly onSaved: () => void
}

/** La hoja de los datos fiscales: si el local ya puede emitir, sus datos y credenciales SOL, y el certificado digital. */
export function FiscalDataSheet({ settings, open, onOpenChange, onSaved }: FiscalDataSheetProps) {
  // El vencimiento del certificado se mide contra el momento en que se abrió la pantalla.
  const [now] = useState(() => Date.now())

  return (
    <DetailSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Datos fiscales"
      description="El RUC, las series, las credenciales SOL y el certificado digital. Se llenan una vez."
    >
      <div className="flex flex-col gap-6">
        <BillingReadiness settings={settings} now={now} />
        <BillingSettingsForm settings={settings} onSaved={onSaved} />
        <CertificateForm settings={settings} now={now} />
      </div>
    </DetailSheet>
  )
}
