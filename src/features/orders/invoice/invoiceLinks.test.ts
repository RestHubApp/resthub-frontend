import { describe, expect, it } from '@jest/globals'

import { isHttpsUrl, whatsappLink, whatsappNumber } from './invoiceLinks'

describe('invoiceLinks', () => {
  it('solo usa direcciones https', () => {
    expect(isHttpsUrl('https://nubefact.com/a.pdf')).toBe(true)
    expect(isHttpsUrl('http:' + '//nubefact.com/a.pdf')).toBe(false)
    expect(isHttpsUrl('javascript:alert(1)')).toBe(false)
    expect(isHttpsUrl('')).toBe(false)
  })

  it('arma el número de WhatsApp: solo dígitos y con el 51 a un celular peruano de 9 dígitos', () => {
    expect(whatsappNumber('987 654 321')).toBe('51987654321')
    expect(whatsappNumber('+51 987-654-321')).toBe('51987654321')
    expect(whatsappNumber('987•••321')).toBe('')
    expect(whatsappNumber('')).toBe('')
  })

  it('abre el chat con el cliente, o deja elegir a quién si no hay número', () => {
    const message = { label: 'Boleta B001-15', pdfUrl: 'https://x.pe/a.pdf' }

    expect(whatsappLink('987654321', message)).toBe(
      `https://wa.me/51987654321?text=${encodeURIComponent('Hola, te comparto tu Boleta B001-15: https://x.pe/a.pdf')}`,
    )
    expect(whatsappLink('', message).startsWith('https://wa.me/?text=')).toBe(true)
  })
})
