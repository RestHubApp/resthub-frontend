import { describe, expect, it } from '@jest/globals'
import { render, screen } from '@testing-library/react'

import { RecipeQuantityInput } from './RecipeQuantityInput'

const FIELD = { name: 'lines.0.quantity', onChange: () => Promise.resolve(), onBlur: () => Promise.resolve(), ref: () => undefined }

describe('RecipeQuantityInput', () => {
  it('sin error, el campo es válido y de solo lectura si se pide', () => {
    render(<RecipeQuantityInput id="q" field={FIELD} unit="g" readOnly />)

    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('readonly')
    expect(input).toHaveAttribute('aria-invalid', 'false')
  })

  it('con error, lo asocia al campo', () => {
    render(<RecipeQuantityInput id="q" field={FIELD} unit="g" error="Escribe un número" readOnly={false} />)

    expect(screen.getByRole('textbox')).toHaveAccessibleDescription('Escribe un número')
  })
})
