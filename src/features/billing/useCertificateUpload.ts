import { useMutation, useQueryClient } from '@tanstack/react-query'

import { billingQueryKey, billingSettingsQueryKey, uploadCertificate } from '@/api/billing'
import { useNotifications } from '@/store/notifications'
import { readAsBase64 } from './certificateFile'

interface CertificateUpload {
  readonly file: File
  readonly password: string
}

/** Lee el certificado en el navegador, lo sube y deja a la vista los datos fiscales que devolvió el servidor. */
export function useCertificateUpload(onUploaded: () => void) {
  const queryClient = useQueryClient()
  const push = useNotifications((state) => state.push)
  return useMutation({
    mutationFn: async ({ file, password }: CertificateUpload) =>
      uploadCertificate({ content_base64: await readAsBase64(file), password }),
    onSuccess: (saved) => {
      queryClient.setQueryData(billingSettingsQueryKey, saved)
      void queryClient.invalidateQueries({ queryKey: billingQueryKey })
      push({ tone: 'info', message: 'Certificado digital cargado.' })
      onUploaded()
    },
  })
}
