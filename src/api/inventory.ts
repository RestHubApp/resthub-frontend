import { api } from '../services/api'
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

export const ingredientsQueryKey = [...inventoryQueryKey, 'ingredients'] as const
export const lowStockQueryKey = [...inventoryQueryKey, 'low-stock'] as const
export const movementsQueryKey = [...inventoryQueryKey, 'movements'] as const
export const dishCostsQueryKey = [...inventoryQueryKey, 'recipes'] as const

export function recipeQueryKey(menuItemId: number) {
  return [...dishCostsQueryKey, menuItemId] as const
}

export function movementListQueryKey(params: MovementListParams) {
  return [...movementsQueryKey, params] as const
}

function ingredientPath(ingredientId: number): string {
  return `/inventory/ingredients/${String(ingredientId)}`
}

function recipePath(menuItemId: number): string {
  return `/inventory/recipes/${String(menuItemId)}`
}

export async function fetchIngredients(includeInactive = false): Promise<Ingredient[]> {
  const { data } = await api.get<Ingredient[]>('/inventory/ingredients', {
    params: includeInactive ? { include_inactive: true } : undefined,
  })
  return data
}

export async function createIngredient(payload: CreateIngredientRequest): Promise<Ingredient> {
  const { data } = await api.post<Ingredient>('/inventory/ingredients', payload)
  return data
}

/** La unidad no se edita: cambiarla reinterpretaría el libro de movimientos entero. */
export async function updateIngredient(
  ingredientId: number,
  payload: UpdateIngredientRequest,
): Promise<Ingredient> {
  const { data } = await api.patch<Ingredient>(ingredientPath(ingredientId), payload)
  return data
}

/** Insumos con stock por debajo del mínimo, incluidos los negativos. */
export async function fetchLowStock(): Promise<Ingredient[]> {
  const { data } = await api.get<Ingredient[]>('/inventory/alerts/low-stock')
  return data
}

export async function fetchMovements(params: MovementListParams): Promise<MovementPage> {
  // El tipo es una lista: FastAPI la espera como `kind=a&kind=b`, sin corchetes.
  const { data } = await api.get<MovementPage>('/inventory/movements', {
    params,
    paramsSerializer: { indexes: null },
  })
  return data
}

export async function registerPurchase(payload: PurchaseRequest): Promise<StockChange> {
  const { data } = await api.post<StockChange>('/inventory/purchases', payload)
  return data
}

export async function registerWaste(payload: WasteRequest): Promise<StockChange> {
  const { data } = await api.post<StockChange>('/inventory/waste', payload)
  return data
}

/** Con `counted_stock`, el servidor calcula la diferencia; con `quantity`, se aplica tal cual. */
export async function registerAdjustment(payload: AdjustmentRequest): Promise<StockChange> {
  const { data } = await api.post<StockChange>('/inventory/adjustments', payload)
  return data
}

/** Costo, margen y porcentaje de margen de cada plato, tenga o no receta. */
export async function fetchDishCosts(): Promise<DishCost[]> {
  const { data } = await api.get<DishCost[]>('/inventory/recipes')
  return data
}

export async function fetchRecipe(menuItemId: number): Promise<Recipe> {
  const { data } = await api.get<Recipe>(recipePath(menuItemId))
  return data
}

/** Reemplaza la receta entera. Una lista vacía la borra. */
export async function replaceRecipe(
  menuItemId: number,
  payload: ReplaceRecipeRequest,
): Promise<Recipe> {
  const { data } = await api.put<Recipe>(recipePath(menuItemId), payload)
  return data
}
