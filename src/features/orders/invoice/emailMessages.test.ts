import { describe, expect, it } from '@jest/globals'

import { ApiError } from '@/services/apiError'
import { emailErrorMessage } from './emailMessages'

function failure(code: string, status: number) {
  return new ApiError({ method: 'POST', path: '/billing/invoices/1/email', requestId: 'r', status, body: { detail: 'x', code } })
}

describe('emailErrorMessage', () => {
  it('traduce cada código del envío por correo', () => {
    expect(emailErrorMessage(failure('email_rate_limited', 429), 20)).toBe('Se llegó al límite de 20 correos por hora. Inténtalo más tarde.')
    expect(emailErrorMessage(failure('email_sending_disabled', 409), 20)).toContain('no está activado')
    expect(emailErrorMessage(failure('email_delivery', 502), 20)).toContain('No se pudo entregar')
    expect(emailErrorMessage(failure('validation_error', 422), 20)).toBe('Escribe un correo válido.')
  })

  it('con un error desconocido da un mensaje general', () => {
    expect(emailErrorMessage(new Error('boom'), 20)).toBe('No se pudo enviar el comprobante. Vuelve a intentarlo.')
  })
})
