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

// Pedidos, mesas y la carta que usa la toma de pedidos. Los nombres de la
// carta llevan el prefijo `Order` para no chocar con los de la pantalla Menú.
export type OrderMenu = components['schemas']['MenuResponse']
export type OrderMenuSection = components['schemas']['MenuSectionResponse']
export type OrderMenuItem = components['schemas']['MenuItemResponse']

export type TableState = components['schemas']['TableStateResponse']
export type TableResponse = components['schemas']['TableResponse']
export type ActiveOrderSummary = components['schemas']['ActiveOrderSummary']
export type CreateTableRequest = components['schemas']['CreateTableRequest']
export type UpdateTableRequest = components['schemas']['UpdateTableRequest']

export type OrderResponse = components['schemas']['OrderResponse']
export type OrderItemResponse = components['schemas']['OrderItemResponse']
export type OrderPageResponse = components['schemas']['OrderPageResponse']
export type OrderStatus = components['schemas']['OrderStatus']
export type OrderType = components['schemas']['OrderType']
export type PaymentMethod = components['schemas']['PaymentMethod']
export type OpenOrderRequest = components['schemas']['OpenOrderRequest']
export type NewItemRequest = components['schemas']['NewItemRequest']
export type ChangeItemRequest = components['schemas']['ChangeItemRequest']
export type UpdateOrderRequest = components['schemas']['UpdateOrderRequest']
export type ChargeOrderRequest = components['schemas']['ChargeOrderRequest']
export type OrderListParams = NonNullable<
  operations['list_orders_api_v1_orders_get']['parameters']['query']
>

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

// Panel BI e IA (`/insights`).
export type InsightsPeriod = components['schemas']['PeriodResponse']
export type InsightsRangeParams = NonNullable<
  operations['sales_summary_api_v1_insights_summary_get']['parameters']['query']
>
export type SalesSummary = components['schemas']['SalesSummaryResponse']
export type DailySales = components['schemas']['DailySalesResponse']
export type DailySalesPoint = components['schemas']['DailySalesPoint']
export type HourlySales = components['schemas']['HourlySalesResponse']
export type HourlyCell = components['schemas']['HourlyCellResponse']
export type PaymentMix = components['schemas']['PaymentMixResponse']
export type PaymentShare = components['schemas']['PaymentShareResponse']
export type WaiterPerformanceList = components['schemas']['WaitersResponse']
export type WaiterPerformance = components['schemas']['WaiterPerformanceResponse']
export type TopDishes = components['schemas']['TopDishesResponse']
export type TopDish = components['schemas']['TopDishResponse']
export type DishMargins = components['schemas']['DishMarginsResponse']
export type DishMargin = components['schemas']['DishMarginResponse']
export type LowStockItem = components['schemas']['LowStockResponse']
export type WasteReport = components['schemas']['WasteReportResponse']
export type WasteByCause = components['schemas']['WasteByCauseResponse']
export type WasteByIngredient = components['schemas']['WasteByIngredientResponse']
export type ClassifyWasteResult = components['schemas']['ClassifyWasteResponse']
export type RestockReport = components['schemas']['RestockResponse']
export type RestockItem = components['schemas']['RestockItemResponse']
export type RestockAction = components['schemas']['RestockAction']
export type DecisionEngine = components['schemas']['Engine']
export type DecisionKind = components['schemas']['DecisionKind']
export type AiDecision = components['schemas']['AiDecisionResponse']
export type AiDecisionPage = components['schemas']['AiDecisionPageResponse']
export type AiDecisionParams = NonNullable<
  operations['list_ai_decisions_api_v1_insights_ai_decisions_get']['parameters']['query']
>
export type OrderNoteClassification = components['schemas']['NoteClassificationResponse']
export type OrderNotesReport = components['schemas']['OrderNotesResponse']
