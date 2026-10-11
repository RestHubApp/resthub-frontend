import { describe, expect, it } from '@jest/globals'
import { render, screen } from '@testing-library/react'

import { CashDifferenceBar } from './CashDifferenceBar'

describe('CashDifferenceBar', () => {
  it('muestra una raya mientras el monto no es válido', () => {
    render(<CashDifferenceBar difference={null} />)

    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('anuncia la diferencia cuando hay monto', () => {
    const { container } = render(<CashDifferenceBar difference={0} />)

    expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent('Diferencia')
    expect(screen.queryByText('—')).not.toBeInTheDocument()
  })
})
