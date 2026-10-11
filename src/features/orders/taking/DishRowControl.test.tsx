import { describe, expect, it } from '@jest/globals'
import { render, screen } from '@testing-library/react'

import { DishRowControl } from './DishRowControl'

describe('DishRowControl', () => {
  it('sin porciones elegidas no muestra nada', () => {
    const { container } = render(<DishRowControl name="Lomo" quantity={0} hasOptions={false} onChange={() => undefined} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('un plato sin opciones muestra el menos y el mas', () => {
    render(<DishRowControl name="Lomo" quantity={2} hasOptions={false} onChange={() => undefined} />)

    expect(screen.getByRole('button', { name: 'Uno menos de Lomo' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Uno más de Lomo' })).toBeInTheDocument()
  })

  it('un plato con opciones muestra solo la cantidad', () => {
    render(<DishRowControl name="Lomo" quantity={2} hasOptions onChange={() => undefined} />)

    expect(screen.getByText('×2')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
