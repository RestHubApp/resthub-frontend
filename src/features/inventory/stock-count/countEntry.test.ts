import { describe, expect, it } from '@jest/globals'

import { countLine, packaging } from '#jest/fixtures/stockControl'
import { contentByWeight, packageName, packagesToBase } from '@/features/inventory/packaging'
import { packagingIssues } from '@/features/inventory/packagingSchema'
import { clearLinePayload, countLinePayload, countOptions, draftOf, readDraft, readingText } from './countEntry'

const PISCO = countLine({ ingredient_id: 2, ingredient_name: 'Pisco', unit: 'ml', packaging: packaging() })
const LIMON = countLine()

// Intl separa la cantidad de la unidad con un espacio que no se corta.
function flat(text: string | null): string | null {
  return text?.replaceAll(/\s/gu, ' ') ?? null
}

describe('presentación del insumo', () => {
  it('n envases a la unidad base, con tres decimales', () => {
    expect(packagesToBase(3, packaging())).toBe(2250)
    expect(packagesToBase(0.5, packaging())).toBe(375)
    expect(packagesToBase(1 / 3, packaging({ size: '1' }))).toBeCloseTo(0.333, 3)
    expect(flat(packageName(packaging(), 'ml'))).toBe('botella de 750 ml')
    expect(flat(packageName(packaging({ label: '' }), 'ml'))).toBe('envase de 750 ml')
  })

  it('por peso: lo que queda en el abierto, acotado entre vacío y lleno', () => {
    // (875 − 500) / (1250 − 500) × 750 = 375 ml: media botella.
    expect(contentByWeight(875, packaging())).toEqual({ content: 375, limit: null })
    expect(contentByWeight(500, packaging())).toEqual({ content: 0, limit: 'empty' })
    expect(contentByWeight(300, packaging())).toEqual({ content: 0, limit: 'empty' })
    expect(contentByWeight(1250, packaging())).toEqual({ content: 750, limit: 'full' })
    expect(contentByWeight(1400, packaging())).toEqual({ content: 750, limit: 'full' })
    expect(contentByWeight(875, packaging({ full_weight_g: null, empty_weight_g: null, weighable: false }))).toBeNull()
  })

  it('el formulario pide el tamaño si hay otros datos, los dos pesos juntos y el lleno más pesado', () => {
    const empty = { packaging_size: '', packaging_size_unit: 'ml', packaging_label: '', packaging_full: '', packaging_empty: '' }
    expect(packagingIssues(empty)).toEqual([])
    expect(packagingIssues({ ...empty, packaging_label: 'botella' })).toEqual([['packaging_size', 'Escribe cuánto trae el envase']])
    expect(packagingIssues({ ...empty, packaging_size: '0' })).toEqual([['packaging_size', 'Tiene que ser mayor que cero']])
    const sized = { ...empty, packaging_size: '750' }
    expect(packagingIssues({ ...sized, packaging_full: '1250' })[0]?.[0]).toBe('packaging_empty')
    expect(packagingIssues({ ...sized, packaging_full: '1250', packaging_empty: '0' })).toEqual([['packaging_empty', 'Tiene que ser mayor que cero']])
    expect(packagingIssues({ ...sized, packaging_full: '500', packaging_empty: '500' })).toEqual([['packaging_full', 'El envase lleno tiene que pesar más que vacío']])
    expect(packagingIssues({ ...sized, packaging_full: '1250', packaging_empty: '500' })).toEqual([])
  })
})

describe('cómo se cuenta una línea', () => {
  it('ofrece la unidad, el envase y el peso solo si el insumo los tiene', () => {
    expect(countOptions(LIMON).map((option) => option.label)).toEqual(['kg', 'g'])
    expect(countOptions(PISCO).map((option) => option.label)).toEqual(['L', 'ml', 'botella', 'Por peso'])
    const withoutWeights = countLine({ unit: 'ml', packaging: packaging({ full_weight_g: null, empty_weight_g: null, weighable: false }) })
    expect(countOptions(withoutWeights).map((option) => option.mode)).toEqual(['base', 'base', 'packages'])
  })

  it('sin conteo propone el envase; con conteo, repite lo que se escribió', () => {
    expect(draftOf(PISCO)).toEqual({ option: 'package', quantity: '', fullPackages: '' })
    expect(draftOf(LIMON)).toEqual({ option: 'kg', quantity: '', fullPackages: '' })
    const weighed = countLine({ ...PISCO, counted: '2625', entry_mode: 'weight', entry_quantity: '875.000', entry_full_packages: '3.000' })
    expect(draftOf(weighed)).toEqual({ option: 'weight', quantity: '875', fullPackages: '3' })
    expect(draftOf(countLine({ counted: '2800', entry_mode: 'base', entry_quantity: '2800.000' }))).toEqual({ option: 'g', quantity: '2800', fullPackages: '' })
  })

  it('convierte en vivo: kg, envases y peso con cerrados', () => {
    expect(readDraft({ option: 'kg', quantity: '2,8', fullPackages: '' }, LIMON).base).toBe(2800)
    expect(readDraft({ option: 'package', quantity: '3.5', fullPackages: '' }, PISCO).base).toBe(2625)
    const weighed = readDraft({ option: 'weight', quantity: '875', fullPackages: '3' }, PISCO)
    expect(weighed).toEqual({ base: 2625, error: null, limit: null })
    expect(flat(readingText(weighed, PISCO))).toBe('= 2.625 L')
  })

  it('avisa la balanza fuera de rango y lo que no es un número', () => {
    const light = readDraft({ option: 'weight', quantity: '400', fullPackages: '' }, PISCO)
    expect(light).toEqual({ base: 0, error: null, limit: 'empty' })
    expect(readingText(light, PISCO)).toContain('cuenta como vacío')
    expect(readingText(readDraft({ option: 'weight', quantity: '1300', fullPackages: '1' }, PISCO), PISCO)).toContain('cuenta como lleno')
    expect(readDraft({ option: 'kg', quantity: '', fullPackages: '' }, LIMON)).toEqual({ base: null, error: null, limit: null })
    expect(readDraft({ option: 'kg', quantity: '1.2345', fullPackages: '' }, LIMON).error).toBe('Escribe un número con hasta 3 decimales')
    expect(readDraft({ option: 'kg', quantity: '-1', fullPackages: '' }, LIMON).error).toBe('Escribe un número con hasta 3 decimales')
    expect(readDraft({ option: 'weight', quantity: '875', fullPackages: 'dos' }, PISCO).error).toContain('envases cerrados')
  })

  it('envía lo escrito: la base en g, los envases tal cual y el peso con sus cerrados', () => {
    expect(countLinePayload(LIMON, { option: 'kg', quantity: '2,8', fullPackages: '' })).toEqual({ ingredient_id: 1, mode: 'base', quantity: '2800', full_packages: '0' })
    expect(countLinePayload(PISCO, { option: 'package', quantity: '3.5', fullPackages: '' })).toEqual({ ingredient_id: 2, mode: 'packages', quantity: '3.5', full_packages: '0' })
    expect(countLinePayload(PISCO, { option: 'weight', quantity: '875', fullPackages: '3' })).toEqual({ ingredient_id: 2, mode: 'weight', quantity: '875', full_packages: '3' })
    expect(clearLinePayload(PISCO)).toEqual({ ingredient_id: 2, mode: 'base', quantity: null, full_packages: '0' })
  })
})
