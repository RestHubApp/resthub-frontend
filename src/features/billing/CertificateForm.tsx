import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import type { BillingSettings } from '@/api/types'
import { FormMessage } from '@/components/FormMessage'
import { TextField } from '@/components/TextField'
import { Button } from '@/components/ui/button'
import { onSubmit } from '@/hooks/formSubmit'
import { billingErrorMessage } from '@/services/billingErrors'
import { CERTIFICATE_EXTENSIONS, certificateFileProblem } from './certificateFile'
import { CertificateStatus } from './CertificateStatus'
import { useCertificateUpload } from './useCertificateUpload'

const schema = z.object({
  file: z.custom<FileList>((value) => value instanceof FileList).superRefine((files, context) => {
    const problem = certificateFileProblem(files[0])
    if (problem !== null) {
      context.addIssue({ code: 'custom', message: problem })
    }
  }),
  password: z.string().max(100, 'Usa como máximo 100 caracteres'),
})
type Values = z.infer<typeof schema>

interface CertificateFormProps {
  readonly settings: BillingSettings
  readonly now: number
}

/**
 * El certificado digital con el que se firman los comprobantes: su estado y
 * cómo subir uno nuevo. El archivo se revisa y se lee en el navegador; la
 * contraseña solo sirve para abrirlo y el servidor no la guarda.
 */
export function CertificateForm({ settings, now }: CertificateFormProps) {
  const { register, handleSubmit, formState, reset } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { password: '' },
  })
  const upload = useCertificateUpload(() => {
    reset()
  })

  return (
    <form noValidate className="flex flex-col gap-4" aria-labelledby="certificado-titulo" onSubmit={onSubmit(handleSubmit(({ file, password }) => {
      const [chosen] = file
      if (chosen !== undefined) upload.mutate({ file: chosen, password })
    }))}>
      <h3 id="certificado-titulo" className="m-0 text-base font-semibold">Certificado digital</h3>
      <CertificateStatus settings={settings} now={now} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField id="certificado-archivo" label={settings.has_certificate ? 'Nuevo certificado' : 'Archivo del certificado'} type="file" icon="upload" accept={CERTIFICATE_EXTENSIONS.join(',')} hint=".pfx, .p12 o .pem; hasta 64 KB." field={register('file')} error={formState.errors.file?.message} />
        <TextField id="certificado-clave" label="Contraseña del certificado" type="password" autoComplete="off" icon="lock" hint="Vacía si el .pem no tiene contraseña. No se guarda." field={register('password')} error={formState.errors.password?.message} />
      </div>
      {upload.isError ? <FormMessage tone="error">{billingErrorMessage(upload.error, 'No se pudo subir el certificado.')}</FormMessage> : null}
      <Button type="submit" variant="outline" className="self-end" disabled={upload.isPending}>
        {upload.isPending ? 'Subiendo…' : 'Subir certificado'}
      </Button>
    </form>
  )
}
