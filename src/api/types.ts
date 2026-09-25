// Alias sobre el contrato generado desde OpenAPI. Nadie escribe estas formas a
// mano: si el backend cambia un campo, `pnpm generate:api` lo propaga y el
// build del frontend falla en compilacion en vez de fallar en ejecucion.
import type { components, operations } from './schema'

export type HealthResponse = components['schemas']['HealthResponse']

export type AccessTokenResponse = components['schemas']['AccessTokenResponse']
export type LoginRequest = components['schemas']['LoginRequest']
export type ChangeOwnPasswordRequest = components['schemas']['ChangeOwnPasswordRequest']
export type CurrentUserResponse = components['schemas']['SessionResponse']
export type UserResponse = components['schemas']['SessionUserResponse']
export type RestaurantResponse = components['schemas']['SessionRestaurantResponse']
export type UserRole = components['schemas']['Role']
export type PermissionCode = components['schemas']['Permission']

export type StaffResponse = components['schemas']['StaffMemberResponse']
export type StaffListResponse = components['schemas']['StaffPageResponse']
export type StaffListParams = NonNullable<
  operations['list_staff_api_v1_staff_get']['parameters']['query']
>
export type CreateStaffRequest = components['schemas']['RegisterStaffRequest']
export type UpdateStaffRequest = components['schemas']['UpdateStaffRequest']
export type ResetStaffPasswordRequest = components['schemas']['ResetStaffPasswordRequest']

// Menú: categorías y platos.
export type MenuResponse = components['schemas']['MenuResponse']
export type MenuSection = components['schemas']['MenuSectionResponse']
export type MenuCategory = components['schemas']['MenuCategoryResponse']
export type MenuItem = components['schemas']['MenuItemResponse']
export type CreateCategoryRequest = components['schemas']['CreateCategoryRequest']
export type UpdateCategoryRequest = components['schemas']['UpdateCategoryRequest']
export type CreateMenuItemRequest = components['schemas']['CreateMenuItemRequest']
export type UpdateMenuItemRequest = components['schemas']['UpdateMenuItemRequest']

// Inventario: insumos, libro de movimientos y recetas.
export type Ingredient = components['schemas']['IngredientResponse']
export type IngredientUnit = components['schemas']['Unit']
export type CreateIngredientRequest = components['schemas']['CreateIngredientRequest']
export type UpdateIngredientRequest = components['schemas']['UpdateIngredientRequest']
export type Movement = components['schemas']['MovementResponse']
export type MovementKind = components['schemas']['MovementKind']
export type MovementPage = components['schemas']['MovementPageResponse']
export type MovementListParams = NonNullable<
  operations['list_movements_api_v1_inventory_movements_get']['parameters']['query']
>
export type PurchaseRequest = components['schemas']['PurchaseRequest']
export type WasteRequest = components['schemas']['WasteRequest']
export type AdjustmentRequest = components['schemas']['AdjustmentRequest']
export type StockChange = components['schemas']['StockChangeResponse']
export type DishCost = components['schemas']['DishCostResponse']
export type Recipe = components['schemas']['RecipeResponse']
export type RecipeLine = components['schemas']['RecipeLineResponse']
export type ReplaceRecipeRequest = components['schemas']['ReplaceRecipeRequest']
