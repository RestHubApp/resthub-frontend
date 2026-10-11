import { describe, expect, it } from '@jest/globals'
import { render } from '@testing-library/react'

import { AreaSeriesMarks } from './AreaSeriesMarks'
import { areaGeometry } from './areaGeometry'

const POINTS = [
  { key: 'a', axisLabel: 'A', value: 10 },
  { key: 'b', axisLabel: 'B', value: 30 },
]
const GEOMETRY = areaGeometry(POINTS, { width: 400, height: 260 })

function renderMarks(activeIndex: number | null) {
  return render(
    <svg>
      <AreaSeriesMarks
        geometry={GEOMETRY}
        points={POINTS}
        overlayColor="red"
        formatValue={(value) => `S/ ${String(value)}`}
        activeIndex={activeIndex}
      />
    </svg>,
  )
}

describe('AreaSeriesMarks', () => {
  it('rotula el máximo y no dibuja cursor si no hay punto activo', () => {
    const { container, getByText } = renderMarks(null)
    expect(getByText('Máx. S/ 30')).toBeTruthy()
    expect(container.querySelector('line')).toBeNull()
  })

  it('dibuja la cruz del cursor sobre el punto activo', () => {
    const { container } = renderMarks(0)
    expect(container.querySelector('line')).not.toBeNull()
  })
})
