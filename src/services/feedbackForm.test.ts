import { describe, expect, it } from '@jest/globals'

import { parseFeedbackFormUrl } from './feedbackForm'

describe('parseFeedbackFormUrl', () => {
  it('acepta un formulario https', () => {
    expect(parseFeedbackFormUrl('  https://forms.gle/abc123  ')).toBe('https://forms.gle/abc123')
  })

  it('no ofrece enlace sin variable, vacía o inválida', () => {
    expect(parseFeedbackFormUrl(undefined)).toBeUndefined()
    expect(parseFeedbackFormUrl('   ')).toBeUndefined()
    expect(parseFeedbackFormUrl('no es una dirección')).toBeUndefined()
  })

  it('rechaza lo que no es https', () => {
    expect(parseFeedbackFormUrl('data:text/html,hola')).toBeUndefined()
    expect(parseFeedbackFormUrl('javascript:alert(1)')).toBeUndefined()
  })
})
