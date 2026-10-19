import type { ErrorCode } from '@/api/types'
import { errorCode, errorMessage } from '@/services/apiError'

// Los errores del control de mermas (presentaciones, conteos y aprobaciones)
// en palabras simples, elegidos por el código del error y no por su texto.

const MESSAGES: Partial<Record<ErrorCode, string>> = {
  invalid_packaging: 'Revisa el envase: el tamaño tiene que ser mayor que cero y, si pones pesos, van los dos y el lleno pesa más que el vacío.',
  invalid_quantity_entry: 'Ese insumo no se puede contar así: le falta el envase o sus pesos. Escribe la cantidad en su unidad.',
  stock_count_already_open: 'Ya hay un conteo en curso. Termínalo o cancélalo antes de empezar otro.',
  stock_count_not_open: 'Ese conteo ya no está en curso: alguien lo cerró o lo canceló.',
  stock_count_not_closed: 'Las diferencias se ven cuando el conteo está cerrado.',
  stock_count_not_found: 'Ese conteo no existe.',
  invalid_stock_count: 'Para cerrar el conteo, cuenta al menos un insumo. Si no vas a contar nada, cancélalo.',
  ingredient_inactive: 'Uno de los insumos está desactivado: quítalo de la selección.',
  ingredient_not_found: 'Ese insumo ya no existe.',
  waste_already_decided: 'Esa merma ya fue aprobada o rechazada por otra persona.',
  waste_approval_not_found: 'Esa merma ya no existe.',
  invalid_waste_approval: 'Escribe el motivo del rechazo.',
  invalid_waste_approval_threshold: 'Escribe un monto mayor que cero con hasta 2 decimales, o déjalo vacío.',
  missing_permission: 'No tienes permiso para hacer esto.',
}

/** El mensaje para un error del inventario: el del código si lo conocemos, si no el del servidor o `fallback`. */
export function inventoryErrorMessage(error: unknown, fallback: string): string {
  const code = errorCode(error)
  return (code === undefined ? undefined : MESSAGES[code]) ?? errorMessage(error, fallback)
}
