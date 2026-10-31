import type { UseFormRegisterReturn } from 'react-hook-form'

import * as icons from '@/components/icons'
import { TextField } from '@/components/TextField'
import { CERTIFICATE_EXTENSIONS } from './certificateFile'

interface CertificateField {
  readonly field: UseFormRegisterReturn
  readonly error: string | undefined
}

interface CertificateFieldsProps {
  /** Ya hay un certificado: el archivo que se elige lo reemplaza. */
  readonly hasCertificate: boolean
  readonly file: CertificateField
  readonly password: CertificateField
}

/** El archivo del certificado y su contraseña, lado a lado en la laptop. */
export function CertificateFields({ hasCertificate, file, password }: CertificateFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField id="certificado-archivo" label={hasCertificate ? 'Nuevo certificado' : 'Archivo del certificado'} type="file" icon={icons.upload} accept={CERTIFICATE_EXTENSIONS.join(',')} hint=".pfx, .p12 o .pem; hasta 64 KB." field={file.field} error={file.error} />
      <TextField id="certificado-clave" label="Contraseña del certificado" type="password" autoComplete="off" icon={icons.lock} hint="Vacía si el .pem no tiene contraseña. No se guarda." field={password.field} error={password.error} />
    </div>
  )
}
