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
export type PermissionCode = components['schemas']['Permission']

// Roles del restaurante: el encargado, el mesero y los que arma cada local.
export type Role = components['schemas']['RoleResponse']
export type RoleKind = components['schemas']['RoleKind']
export type RoleRequest = components['schemas']['RoleRequest']
export type PermissionInfo = components['schemas']['PermissionResponse']

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
export type PaymentRequest = components['schemas']['PaymentRequest']
export type PaymentResponse = components['schemas']['PaymentResponse']
export type DiscountRequest = components['schemas']['DiscountRequest']
export type CourtesyRequest = components['schemas']['CourtesyRequest']

// Caja: el turno abierto, su arqueo y los turnos anteriores.
export type CurrentCash = components['schemas']['CurrentCashResponse']
export type CashSession = components['schemas']['CashSessionResponse']
export type CashSummary = components['schemas']['CashSummaryResponse']
export type CashMethodTotal = components['schemas']['MethodTotalResponse']
export type CashWaiterTips = components['schemas']['WaiterTipsResponse']
export type CashSessionPage = components['schemas']['CashSessionPageResponse']
export type OpenCashRequest = components['schemas']['OpenCashRequest']
export type CloseCashRequest = components['schemas']['CloseCashRequest']

// El restaurante propio, con el tope de descuento del mesero.
export type OwnRestaurant = components['schemas']['RestaurantResponse']
export type UpdateRestaurantRequest = components['schemas']['UpdateRestaurantRequest']
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

// Compras: proveedores, órdenes de compra y lo que conviene pedir.
export type Supplier = components['schemas']['SupplierResponse']
export type SupplierRequest = components['schemas']['SupplierRequest']
export type PurchaseOrder = components['schemas']['PurchaseOrderResponse']
export type PurchaseOrderLine = components['schemas']['PurchaseLineResponse']
export type PurchaseOrderPage = components['schemas']['PurchaseOrderPageResponse']
export type PurchaseOrderStatus = components['schemas']['PurchaseOrderStatus']
export type CreatePurchaseOrderRequest = components['schemas']['CreatePurchaseOrderRequest']
export type ReceivePurchaseOrderRequest = components['schemas']['ReceivePurchaseOrderRequest']
export type PurchaseSuggestion = components['schemas']['PurchaseSuggestionResponse']

// Comprobantes electrónicos: datos fiscales, boletas y facturas.
export type BillingSettings = components['schemas']['BillingSettingsResponse']
export type BillingSettingsRequest = components['schemas']['BillingSettingsRequest']
export type Invoice = components['schemas']['InvoiceResponse']
export type InvoicePage = components['schemas']['InvoicePageResponse']
export type IssueInvoiceRequest = components['schemas']['IssueInvoiceRequest']
export type InvoiceKind = components['schemas']['InvoiceKind']
export type InvoiceStatus = components['schemas']['InvoiceStatus']
export type DocumentType = components['schemas']['DocumentType']

// Clientes frecuentes y reservas de mesa.
export type Customer = components['schemas']['CustomerResponse']
export type CustomerPage = components['schemas']['CustomerPageResponse']
export type CustomerRequest = components['schemas']['CustomerRequest']
export type Reservation = components['schemas']['ReservationResponse']
export type ReservationRequest = components['schemas']['ReservationRequest']
export type ReservationStatus = components['schemas']['ReservationStatus']

// Administración del sistema (`/platform`): el equipo de RestHub, sus
// restaurantes, sus encargados y la bitácora.
export type PlatformAdmin = components['schemas']['PlatformAdminResponse']
export type PlatformLoginRequest = components['schemas']['PlatformLoginRequest']
export type PlatformTokenResponse = components['schemas']['PlatformAccessTokenResponse']
export type PlatformMeResponse = components['schemas']['PlatformSessionResponse']
export type PlatformRestaurantSummary = components['schemas']['RestaurantSummaryResponse']
export type PlatformRestaurantPage = components['schemas']['RestaurantPageResponse']
export type PlatformRestaurantListParams = NonNullable<
  operations['list_restaurants_api_v1_platform_restaurants_get']['parameters']['query']
>
export type PlatformRestaurantDetail = components['schemas']['RestaurantDetailResponse']
export type PlatformOwner = components['schemas']['OwnerResponse']
export type PlatformOwnerRequest = components['schemas']['NewOwnerRequest']
export type CreatePlatformRestaurantRequest = components['schemas']['CreateRestaurantRequest']
export type UpdatePlatformRestaurantRequest = components['schemas']['PlatformUpdateRestaurantRequest']
export type PlatformActivityEntry = components['schemas']['PlatformActivityResponse']
export type PlatformActivityPage = components['schemas']['PlatformActivityPageResponse']
export type PlatformActivityParams = NonNullable<
  operations['read_activity_api_v1_platform_activity_get']['parameters']['query']
>

// Vista previa: el local de muestra, sus cuentas y el código de un solo uso
// con que una pestaña nueva entra como su encargado o su mesero.
export type PlatformSandbox = components['schemas']['SandboxResponse']
export type PlatformSandboxAccount = components['schemas']['SandboxAccountResponse']
export type PreviewAs = components['schemas']['PreviewAs']
export type PreviewRequest = components['schemas']['PreviewRequest']
export type PreviewCodeResponse = components['schemas']['PreviewCodeResponse']
export type PreviewExchangeRequest = components['schemas']['PreviewExchangeRequest']
