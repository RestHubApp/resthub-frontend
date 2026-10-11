import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'

import { PASSWORD_MUTATION_GC_TIME, platformLogin, platformMutationKeys } from '@/api/platform'
import type { PlatformAdmin } from '@/api/types'
import { onSubmit } from '@/hooks/formSubmit'
import { platformLoginSchema, type PlatformLoginValues } from './platformSchema'

/** El formulario de ingreso de plataforma: campos, validación y la mutación de login. */
export function usePlatformLogin(onSignedIn: (token: string, admin: PlatformAdmin) => void) {
  const { register, handleSubmit, formState } = useForm<PlatformLoginValues>({
    resolver: zodResolver(platformLoginSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  })
  const access = useMutation({
    mutationKey: platformMutationKeys.login,
    mutationFn: platformLogin,
    gcTime: PASSWORD_MUTATION_GC_TIME,
    onSuccess: ({ access_token: token, admin }) => {
      onSignedIn(token, admin)
    },
  })
  const submit = onSubmit(
    handleSubmit((values) => {
      access.mutate(values)
    }),
  )

  return { register, errors: formState.errors, access, submit }
}
