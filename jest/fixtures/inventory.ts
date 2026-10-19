// Datos de inventario, compras y mesas para las pruebas, con la forma del API.
import type {
  DishCost,
  Ingredient,
  MenuItem,
  MenuResponse,
  MenuSection,
  Movement,
  PurchaseOrder,
  PurchaseSuggestion,
  Recipe,
  StockChange,
  Supplier,
  TableState,
} from '../../src/api/types'

const CREATED = '2026-09-26T13:00:00Z'

export function ingredient(changes: Partial<Ingredient> = {}): Ingredient {
  return {
    id: 1,
    name: 'Limón',
    unit: 'g',
    unit_label: 'gramos',
    stock: '5000',
    min_stock: '2000',
    unit_cost: '0.004',
    is_active: true,
    is_low: false,
    is_negative: false,
    packaging: null,
    created_at: CREATED,
    ...changes,
  }
}

export function movement(changes: Partial<Movement> = {}): Movement {
  return {
    id: 1,
    created_at: CREATED,
    created_by: 7,
    ingredient_id: 1,
    ingredient_name: 'Limón',
    kind: 'purchase',
    kind_label: 'Compra',
    order_id: null,
    order_item_id: null,
    order_number: null,
    quantity: '1000',
    reason: 'Mercado',
    unit: 'g',
    unit_cost: '0.004',
    entry_mode: 'base',
    entry_quantity: '1000',
    stock_count_id: null,
    ...changes,
  }
}

/** Lo que devuelven compra, merma y ajuste: el insumo como quedó y su movimiento. */
export function stockChange(sourceIngredient: Ingredient, mov: Partial<Movement> = {}): StockChange {
  return { ingredient: sourceIngredient, movement: movement({ ingredient_id: sourceIngredient.id, ...mov }) }
}

export function dishCost(changes: Partial<DishCost> = {}): DishCost {
  return {
    menu_item_id: 10,
    menu_item_name: 'Ceviche',
    price: '30.00',
    cost: '12.00',
    margin: '18.00',
    margin_percent: '60.0',
    has_recipe: true,
    is_active: true,
    ...changes,
  }
}

export function recipe(changes: Partial<Recipe> = {}): Recipe {
  return {
    menu_item_id: 10,
    menu_item_name: 'Ceviche',
    price: '30.00',
    cost: '1.00',
    margin: '29.00',
    margin_percent: '96.7',
    has_recipe: true,
    is_active: true,
    lines: [
      { ingredient_id: 1, ingredient_name: 'Limón', quantity: '250', unit: 'g', unit_cost: '0.004', cost: '1.00' },
    ],
    ...changes,
  }
}

export function supplier(changes: Partial<Supplier> = {}): Supplier {
  return {
    id: 4,
    name: 'Mercado Central',
    contact: 'Rosa',
    phone: '987654321',
    notes: '',
    is_active: true,
    created_at: CREATED,
    ...changes,
  }
}

export function purchaseOrder(changes: Partial<PurchaseOrder> = {}): PurchaseOrder {
  return {
    id: 20,
    number: 3,
    supplier_id: 4,
    supplier_name: 'Mercado Central',
    status: 'draft',
    status_label: 'Borrador',
    notes: '',
    created_at: CREATED,
    sent_at: null,
    received_at: null,
    cancelled_at: null,
    estimated_total: '20.00',
    received_total: '0.00',
    lines: [
      {
        id: 31,
        ingredient_id: 1,
        ingredient_name: 'Limón',
        quantity: '5000',
        unit: 'g',
        unit_cost: '0.004',
        estimated_total: '20.00',
        received_quantity: null,
        received_unit_cost: null,
      },
    ],
    ...changes,
  }
}

export function suggestion(changes: Partial<PurchaseSuggestion> = {}): PurchaseSuggestion {
  return {
    ingredient_id: 1,
    ingredient_name: 'Limón',
    quantity: '3000',
    unit: 'g',
    unit_cost: '0.004',
    stock: '500',
    min_stock: '2000',
    average_daily_use: '400',
    ...changes,
  }
}

export function table(changes: Partial<TableState> = {}): TableState {
  return {
    id: 1,
    label: '1',
    position: 0,
    is_active: true,
    status: 'free',
    status_label: 'Libre',
    active_order: null,
    created_at: CREATED,
    ...changes,
  }
}

/** Un resumen de pedido en curso, para una mesa ocupada. */
export function orderInTable(number = 12): NonNullable<TableState['active_order']> {
  return {
    id: 100 + number,
    number,
    status: 'open',
    status_label: 'Abierto',
    status_changed_at: CREATED,
    created_at: CREATED,
    updated_at: CREATED,
    item_count: 2,
    total: '40.00',
    balance: '40.00',
    waiter_id: 7,
    waiter_name: 'Ana Torres',
  }
}

export function dish(changes: Partial<MenuItem> = {}): MenuItem {
  return {
    id: 10,
    category_id: 1,
    name: 'Ceviche',
    description: 'Pescado del día y leche de tigre.',
    price: '30.00',
    position: 0,
    is_active: true,
    is_available: true,
    out_of_stock: false,
    modifier_groups: [],
    photo_version: null,
    created_at: CREATED,
    ...changes,
  }
}

export function category(changes: Partial<MenuSection> = {}): MenuSection {
  return { id: 1, name: 'Entradas', position: 0, is_active: true, created_at: CREATED, items: [dish()], ...changes }
}

/** Dos categorías: Entradas (Ceviche y Causa, esta agotada) y Bebidas vacía. */
export function buildMenu(): MenuResponse {
  return {
    categories: [
      category({
        items: [dish(), dish({ id: 11, name: 'Causa', price: '18.00', position: 1, is_available: false, description: '' })],
      }),
      category({ id: 2, name: 'Bebidas', position: 1, items: [] }),
    ],
  }
}
