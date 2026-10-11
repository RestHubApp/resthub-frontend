import { describe, expect, it } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import type { UseFormRegisterReturn } from 'react-hook-form'

import { StaffEmailField } from './StaffEmailField'

const FIELD: UseFormRegisterReturn = { name: 'email', onChange: () => Promise.resolve(), onBlur: () => Promise.resolve(), ref: () => undefined }

describe('StaffEmailField', () => {
  it('sin campo registrado muestra el correo fijo', () => {
    render(<StaffEmailField fixedEmail="ana@correo.com" />)
    expect(screen.getByText('ana@correo.com')).toBeInTheDocument()
  })

  it('con campo registrado deja escribir el correo y muestra su error', () => {
    render(<StaffEmailField field={FIELD} error="Correo inválido" />)
    expect(screen.getByRole('textbox', { name: /Correo/u })).toBeInTheDocument()
    expect(screen.getByText('Correo inválido')).toBeInTheDocument()
  })
})
