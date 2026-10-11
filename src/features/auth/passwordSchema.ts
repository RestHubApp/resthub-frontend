import { z } from 'zod'

import { passwordRule } from '@/services/fieldRules'

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Escribe tu contraseña actual'),
    new_password: passwordRule,
    confirm_password: z.string(),
  })
  .refine((values) => values.new_password === values.confirm_password, {
    message: 'Las dos contraseñas no coinciden',
    path: ['confirm_password'],
  })
  .refine((values) => values.new_password !== values.current_password, {
    message: 'La nueva contraseña tiene que ser distinta de la actual',
    path: ['new_password'],
  })

export type ChangePasswordForm = z.infer<typeof changePasswordSchema>

export const EMPTY_CHANGE_PASSWORD: ChangePasswordForm = {
  current_password: '',
  new_password: '',
  confirm_password: '',
}
