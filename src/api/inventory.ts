import { queryOptions } from '@tanstack/react-query'

import { send } from './client'
import type {
  AdjustmentRequest,
  CreateIngredientRequest,
  DishCost,
  Ingredient,
  MovementListParams,
  MovementPage,
  PurchaseRequest,
  Recipe,
  ReplaceRecipeRequest,
  StockChange,
  UpdateIngredientRequest,
  WasteRequest,
} from './types'

// Inventario: insumos, su libro de movimientos y las recetas de los platos.
// El stock nunca se escribe: es la suma de los movimientos del libro.

export const inventoryQueryKey = ['inventory'] as const

const ingredientsQueryKey = [...inventoryQueryKey, 'ingredients'] as const
const lowStockQueryKey = [...inventoryQueryKey, 'low-stock'] as const
const movementsQueryKey = [...inventoryQueryKey, 'movements'] as const
export const dishCostsQueryKey = [...inventoryQueryKey, 'recipes'] as const

function recipeQueryKey(menuItemId: number) {
  return [...dishCostsQueryKey, menuItemId] as const
}

function movementListQueryKey(params: MovementListParams) {
  return [...movementsQueryKey, params] as const
}

async function fetchIngredients(includeInactive = false): Promise<Ingredient[]> {
  return send((client) =>
    client.GET('/api/v1/inventory/ingredients', {
      params: { query: includeInactive ? { include_inactive: true } : {} },
    }),
  )
}

/** Los insumos activos, que comparten la tabla, las recetas y la precarga. */
export const ingredientsQuery = queryOptions({
  queryKey: ingredientsQueryKey,
  queryFn: () => fetchIngredients(),
})

export async function createIngredient(payload: CreateIngredientRequest): Promise<Ingredient> {
  return send((client) => client.POST('/api/v1/inventory/ingredients', { body: payload }))
}

/** La unidad no se edita: cambiarla reinterpretaría el libro de movimientos entero. */
export async function updateIngredient(
  ingredientId: number,
  payload: UpdateIngredientRequest,
): Promise<Ingredient> {
  return send((client) =>
    client.PATCH('/api/v1/inventory/ingredients/{ingredient_id}', {
      params: { path: { ingredient_id: ingredientId } },
      body: payload,
    }),
  )
}

/** Insumos con stock por debajo del mínimo, incluidos los negativos. */
async function fetchLowStock(): Promise<Ingredient[]> {
  return send((client) => client.GET('/api/v1/inventory/alerts/low-stock'))
}

export const lowStockQuery = queryOptions({ queryKey: lowStockQueryKey, queryFn: fetchLowStock })

async function fetchMovements(params: MovementListParams): Promise<MovementPage> {
  // El tipo es una lista: FastAPI la espera como `kind=a&kind=b`, sin corchetes
  // (la forma por defecto del cliente).
  return send((client) => client.GET('/api/v1/inventory/movements', { params: { query: params } }))
}

export async function registerPurchase(payload: PurchaseRequest): Promise<StockChange> {
  return send((client) => client.POST('/api/v1/inventory/purchases', { body: payload }))
}

export async function registerWaste(payload: WasteRequest): Promise<StockChange> {
  return send((client) => client.POST('/api/v1/inventory/waste', { body: payload }))
}

/** Con `counted_stock`, el servidor calcula la diferencia; con `quantity`, se aplica tal cual. */
export async function registerAdjustment(payload: AdjustmentRequest): Promise<StockChange> {
  return send((client) => client.POST('/api/v1/inventory/adjustments', { body: payload }))
}

/** Costo, margen y porcentaje de margen de cada plato, tenga o no receta. */
async function fetchDishCosts(): Promise<DishCost[]> {
  return send((client) => client.GET('/api/v1/inventory/recipes'))
}

export const dishCostsQuery = queryOptions({ queryKey: dishCostsQueryKey, queryFn: fetchDishCosts })

async function fetchRecipe(menuItemId: number): Promise<Recipe> {
  return send((client) =>
    client.GET('/api/v1/inventory/recipes/{menu_item_id}', { params: { path: { menu_item_id: menuItemId } } }),
  )
}

/** Reemplaza la receta entera. Una lista vacía la borra. */
export async function replaceRecipe(
  menuItemId: number,
  payload: ReplaceRecipeRequest,
): Promise<Recipe> {
  return send((client) =>
    client.PUT('/api/v1/inventory/recipes/{menu_item_id}', {
      params: { path: { menu_item_id: menuItemId } },
      body: payload,
    }),
  )
}

export function movementsQuery(params: MovementListParams) {
  return queryOptions({ queryKey: movementListQueryKey(params), queryFn: () => fetchMovements(params) })
}

export function recipeQuery(menuItemId: number) {
  return queryOptions({ queryKey: recipeQueryKey(menuItemId), queryFn: () => fetchRecipe(menuItemId) })
}
