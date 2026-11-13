import { describe, expect, it } from '@jest/globals'
import { render, screen } from '@testing-library/react'

import { EfficientUseCard } from './EfficientUseCard'

const FORM = 'https://forms.gle/abc123'

describe('EfficientUseCard', () => {
  it('da consejos de uso eficiente', () => {
    render(<EfficientUseCard />)

    expect(screen.getByRole('heading', { name: 'Uso eficiente' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(5)
    expect(screen.getByText(/queda guardado en el celular/u)).toBeInTheDocument()
  })

  it('ofrece el formulario de comentarios en otra pestaña cuando está configurado', () => {
    render(<EfficientUseCard feedbackFormUrl={FORM} />)

    const link = screen.getByRole('link', { name: 'Enviar un comentario (se abre en otra pestaña)' })
    expect(link).toHaveAttribute('href', FORM)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('sin formulario no muestra el enlace', () => {
    render(<EfficientUseCard />)

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
