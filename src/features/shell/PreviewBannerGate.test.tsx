import { describe, expect, it } from '@jest/globals'
import { screen } from '@testing-library/react'

import { mountScreen, signInAs } from '#jest/harness'
import { useSession } from '@/store/session'
import { PreviewBannerGate } from './PreviewBannerGate'

describe('PreviewBannerGate', () => {
  it('sin vista previa no muestra el aviso', () => {
    const account = signInAs()
    const { container } = mountScreen(<PreviewBannerGate account={account} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('en vista previa muestra el aviso', () => {
    const account = signInAs(undefined, { preview: true })
    mountScreen(<PreviewBannerGate account={account} />)
    expect(useSession.getState().account?.preview).toBe(true)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
