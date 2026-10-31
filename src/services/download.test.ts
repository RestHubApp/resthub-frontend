import { afterEach, describe, expect, it, jest } from '@jest/globals'

import { saveFile } from './download'

afterEach(() => {
  jest.useRealTimers()
  jest.restoreAllMocks()
})

describe('saveFile', () => {
  it('revoca la URL de objeto un rato después del clic, no enseguida (WebKit la lee después)', () => {
    jest.useFakeTimers()
    const revoke = jest.fn()
    Object.assign(URL, { createObjectURL: () => 'blob:archivo', revokeObjectURL: revoke })
    const names: string[] = []
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function click(this: HTMLAnchorElement) {
      names.push(this.download)
    })

    saveFile(new Blob(['x']), 'a.txt')

    expect(names).toEqual(['a.txt'])
    expect(revoke).not.toHaveBeenCalled()
    jest.advanceTimersByTime(40_000)
    expect(revoke).toHaveBeenCalledWith('blob:archivo')
  })
})
