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
