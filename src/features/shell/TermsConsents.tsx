import type { StaffSession } from '@/api/types'
import { paths } from '@/services/paths'
import { ConsentCheck } from './ConsentCheck'

interface TermsConsentsProps {
  readonly account: StaffSession
  readonly hasAcceptedTerms: boolean
  readonly hasAcceptedData: boolean
  readonly onTermsChange: (checked: boolean) => void
  readonly onDataChange: (checked: boolean) => void
}

/** Los dos consentimientos separados de la puerta «Antes de empezar», cada uno con el enlace a su parte. */
export function TermsConsents({ account, hasAcceptedTerms, hasAcceptedData, onTermsChange, onDataChange }: TermsConsentsProps) {
  return (
    <>
      <ConsentCheck
        id="aceptar-terminos"
        checked={hasAcceptedTerms}
        onChange={onTermsChange}
        readTo={paths.terms}
        readLabel={`Leer los términos y condiciones (versión ${account.terms_version})`}
      >
        Acepto los términos y condiciones del servicio.
      </ConsentCheck>
      <ConsentCheck
        id="aceptar-datos"
        checked={hasAcceptedData}
        onChange={onDataChange}
        readTo={paths.privacy}
        readLabel={`Leer cómo se tratan los datos personales (versión ${account.privacy_version})`}
      >
        Acepto el tratamiento de mis datos personales, conforme a la Ley N.º 29733.
      </ConsentCheck>
    </>
  )
}
