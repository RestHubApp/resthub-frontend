// Datos del control de mermas para las pruebas, con la forma del API: envases,
// conteos físicos, sus diferencias y las mermas por aprobar.
import type { CountDifferences, Packaging, StockCount, StockCountLine, WasteApproval } from '../../src/api/types'

const CREATED = '2026-09-26T13:00:00Z'

/** La botella de pisco de 750 ml: llena pesa 1250 g y vacía 500 g. */
export function packaging(changes: Partial<Packaging> = {}): Packaging {
  return { size: '750', label: 'botella', full_weight_g: '1250', empty_weight_g: '500', weighable: true, ...changes }
}

export function countLine(changes: Partial<StockCountLine> = {}): StockCountLine {
  return {
    ingredient_id: 1,
    ingredient_name: 'Limón',
    unit: 'g',
    packaging: null,
    opening_stock: '5000',
    expected: '5000',
    counted: null,
    entry_mode: null,
    entry_quantity: null,
    entry_full_packages: null,
    counted_by: null,
    counted_at: null,
    difference: null,
    ...changes,
  }
}

/** Un conteo en curso con el limón (en g) y el pisco (en botellas, con pesos). */
export function stockCount(changes: Partial<StockCount> = {}): StockCount {
  return {
    id: 3,
    number: 2,
    status: 'draft',
    status_label: 'En curso',
    scope: 'all',
    note: '',
    created_by: 7,
    created_at: CREATED,
    closed_by: null,
    closed_at: null,
    total_lines: 2,
    counted_lines: 0,
    lines: [
      countLine(),
      countLine({ ingredient_id: 2, ingredient_name: 'Pisco', unit: 'ml', packaging: packaging(), opening_stock: '3000', expected: '3000' }),
    ],
    ...changes,
  }
}

export function countDifferences(changes: Partial<CountDifferences> = {}): CountDifferences {
  const { id, number, scope, note, created_by, created_at } = stockCount()
  return {
    count: { id, number, scope, note, created_by, created_at, status: 'closed', status_label: 'Cerrado', closed_at: CREATED, closed_by: 7, total_lines: 2, counted_lines: 2 },
    lines: [
      { ingredient_id: 2, ingredient_name: 'Pisco', unit: 'ml', expected: '3000', counted: '2250', difference: '-750', difference_percent: '-25.00', unit_cost: '0.04', difference_value: '-30.00' },
      { ingredient_id: 1, ingredient_name: 'Limón', unit: 'g', expected: '5000', counted: '5100', difference: '100', difference_percent: '2.00', unit_cost: '0.004', difference_value: '0.40' },
    ],
    total_value: '-29.60',
    loss_value: '-30.00',
    gain_value: '0.40',
    ...changes,
  }
}

export function wasteApproval(changes: Partial<WasteApproval> = {}): WasteApproval {
  return {
    id: 9,
    ingredient_id: 2,
    ingredient_name: 'Pisco',
    unit: 'ml',
    quantity: '1500',
    unit_cost: '0.04',
    value: '60.00',
    reason: 'Se rompieron dos botellas',
    status: 'pending_approval',
    status_label: 'Por aprobar',
    created_by: 7,
    created_by_name: 'Mesero Prueba',
    created_at: CREATED,
    decided_by: null,
    decided_by_name: null,
    decided_at: null,
    rejection_reason: '',
    movement_id: null,
    ...changes,
  }
}
