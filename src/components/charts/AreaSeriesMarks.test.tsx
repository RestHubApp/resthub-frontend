import { describe, expect, it } from '@jest/globals'
import { render, screen } from '@testing-library/react'

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
    renderMarks(null)
    expect(screen.getByText('Máx. S/ 30')).toBeInTheDocument()
    expect(screen.queryByTestId('area-cursor')).not.toBeInTheDocument()
  })

  it('dibuja la cruz del cursor sobre el punto activo', () => {
    renderMarks(0)
    expect(screen.getByTestId('area-cursor')).toBeInTheDocument()
  })
})
