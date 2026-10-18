import { describe, expect, it } from '@jest/globals'

import { draftsOf, newDraft, periodProblem, savedHoursText, toPeriods } from './openingHours'

describe('horario del local (RFS-32)', () => {
  it('trabaja con horas sin segundos y las devuelve igual', () => {
    const drafts = draftsOf([{ day: 4, opens: '18:00:00', closes: '02:00:00' }])
    expect(drafts[0]).toMatchObject({ day: 4, opens: '18:00', closes: '02:00' })
    expect(toPeriods(drafts)).toEqual([{ day: 4, opens: '18:00', closes: '02:00' }])
  })

  it('un tramo nuevo sigue al último día y copia sus horas', () => {
    expect(newDraft([])).toMatchObject({ day: 0, opens: '12:00', closes: '23:00' })
    const [sunday] = draftsOf([{ day: 6, opens: '09:00', closes: '17:00' }])
    expect(newDraft(sunday === undefined ? [] : [sunday])).toMatchObject({ day: 0, opens: '09:00', closes: '17:00' })
  })

  it('pide las dos horas y que no sean iguales; cerrar de madrugada vale', () => {
    const [draft] = draftsOf([{ day: 0, opens: '08:00', closes: '08:00' }])
    if (draft === undefined) throw new Error('sin tramo')
    expect(periodProblem(draft)).toBe('No puede abrir y cerrar a la misma hora.')
    expect(periodProblem({ ...draft, closes: '' })).toBe('Escribe las dos horas.')
    expect(periodProblem({ ...draft, opens: '20:00', closes: '01:00' })).toBeUndefined()
  })

  it('sin horario avisa que no se marca nada', () => {
    expect(savedHoursText([])).toContain('ya no tiene horario')
    expect(savedHoursText([{ day: 0, opens: '08:00', closes: '16:00' }])).toContain('Horario guardado')
  })
})
