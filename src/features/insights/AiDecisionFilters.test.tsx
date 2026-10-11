import { describe, expect, it, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { AiDecisionFilters } from './AiDecisionFilters'

describe('AiDecisionFilters', () => {
  it('avisa al elegir un tipo y un motor', async () => {
    const onKindChange = jest.fn()
    const onEngineChange = jest.fn()
    render(<AiDecisionFilters kind="" engine="" onKindChange={onKindChange} onEngineChange={onEngineChange} />)

    await userEvent.selectOptions(screen.getByLabelText('Tipo'), 'restock')
    await userEvent.selectOptions(screen.getByLabelText('Motor'), 'rules')

    expect(onKindChange).toHaveBeenCalledWith('restock')
    expect(onEngineChange).toHaveBeenCalledWith('rules')
  })
})
