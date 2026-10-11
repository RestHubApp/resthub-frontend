import { describe, expect, it } from '@jest/globals'
import { render, screen } from '@testing-library/react'

import { RestockUpdateStatus } from './RestockUpdateStatus'

describe('RestockUpdateStatus', () => {
  it('no muestra nada en reposo', () => {
    const { container } = render(<RestockUpdateStatus isPending={false} isError={false} error={null} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('avisa que está decidiendo mientras se actualiza', () => {
    render(<RestockUpdateStatus isPending isError={false} error={null} />)

    expect(screen.getByRole('status')).toHaveTextContent('Decidiendo insumo por insumo')
  })

  it('muestra el error de la actualización', () => {
    render(<RestockUpdateStatus isPending={false} isError error={new Error('falló')} />)

    expect(screen.getByText(/No se pudieron actualizar las recomendaciones/u)).toBeInTheDocument()
  })
})
