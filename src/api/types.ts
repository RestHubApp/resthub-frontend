// Alias sobre el contrato generado desde OpenAPI. Nadie escribe estas formas a
// mano: si el backend cambia un campo, `pnpm generate:api` lo propaga y el
// build del frontend falla en compilacion en vez de fallar en ejecucion.
import type { components, operations, paths } from './schema'

/** Todas las rutas del contrato: el cliente tipado de `src/api/client.ts` se arma con ellas. */
export type ApiPaths = paths

/** El código estable de un error del API (`{ detail, code }`): lo que decide qué hace la interfaz. */
export type ErrorCode = components['schemas']['ErrorCode']

export type StaffAccessTokenResponse = components['schemas']['StaffAccessTokenResponse']
type PlatformAccessTokenResponse = components['schemas']['PlatformAdminAccessTokenResponse']
/** La respuesta de entrar o renovar: la sesión (de personal o de plataforma, según `kind`) y su token. */
export type AccessTokenResponse = StaffAccessTokenResponse | PlatformAccessTokenResponse
export type LoginRequest = components['schemas']['LoginRequest']
export type ChangeOwnPasswordRequest = components['schemas']['ChangeOwnPasswordRequest']
/** La sesión del personal de un restaurante: la cuenta, su restaurante y sus permisos. */
export type StaffSession = components['schemas']['StaffSessionResponse']
/** La sesión de la administración del sistema: la cuenta y sus permisos `platform.*`. */
export type PlatformSession = components['schemas']['PlatformAdminSessionResponse']
/** Lo que devuelve `GET /auth/me`: una u otra, según `kind`. */
export type Session = StaffSession | PlatformSession
export type AcceptTermsRequest = components['schemas']['AcceptTermsRequest']
export type CustomerExport = components['schemas']['CustomerExportResponse']
export type PermissionCode = components['schemas']['Permission']
export type PlatformPermissionCode = components['schemas']['PlatformPermission']
/** Cualquier permiso que una sesión puede traer: del restaurante o de la administración del sistema. */
export type AnyPermissionCode = PermissionCode | PlatformPermissionCode

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
export type ActiveOrderSummary = components['schemas']['ActiveOrderSummaryResponse']
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
export type PaymentRequest = components['schemas']['PaymentRequest']
export type PaymentResponse = components['schemas']['PaymentResponse']
export type DiscountRequest = components['schemas']['DiscountRequest']

// Caja: el turno abierto, su arqueo y los turnos anteriores.
export type CurrentCash = components['schemas']['CurrentCashResponse']
export type CashSession = components['schemas']['CashSessionResponse']
export type CashSummary = components['schemas']['CashSummaryResponse']
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
export type ReplaceRecipeRequest = components['schemas']['ReplaceRecipeRequest']
export type Packaging = components['schemas']['PackagingResponse']
export type PackagingRequest = components['schemas']['PackagingRequest']
export type EntryMode = components['schemas']['EntryMode']

// Conteos físicos: el stock contado contra el del sistema, y sus diferencias.
export type StockCount = components['schemas']['StockCountResponse']
export type StockCountSummary = components['schemas']['StockCountSummaryResponse']
export type StockCountLine = components['schemas']['StockCountLineResponse']
export type StockCountPage = components['schemas']['StockCountPageResponse']
export type StockCountStatus = components['schemas']['StockCountStatus']
export type StockCountListParams = NonNullable<
  operations['list_stock_counts_api_v1_inventory_stock_counts_get']['parameters']['query']
>
export type OpenStockCountRequest = components['schemas']['OpenStockCountRequest']
export type CountLineRequest = components['schemas']['CountLineRequest']
export type CountDifferences = components['schemas']['CountDifferencesResponse']
export type CountDifference = components['schemas']['CountDifferenceResponse']
export type IngredientCountHistory = components['schemas']['IngredientCountHistoryResponse']
export type CountHistoryItem = components['schemas']['CountHistoryItemResponse']

// Mermas grandes que esperan la aprobación del encargado.
export type WasteApproval = components['schemas']['WasteApprovalResponse']
export type WasteApprovalPage = components['schemas']['WasteApprovalPageResponse']
export type WasteApprovalStatus = components['schemas']['WasteApprovalStatus']

// Panel BI e IA (`/insights`).
export type InsightsPeriod = components['schemas']['PeriodResponse']
export type InsightsRangeParams = NonNullable<
  operations['sales_summary_api_v1_insights_summary_get']['parameters']['query']
>
export type SalesSummary = components['schemas']['SalesSummaryResponse']
export type DailySales = components['schemas']['DailySalesResponse']
export type DailySalesPoint = components['schemas']['DailySalesPointResponse']
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
export type PurchaseOrderPage = components['schemas']['PurchaseOrderPageResponse']
export type CreatePurchaseOrderRequest = components['schemas']['CreatePurchaseOrderRequest']
export type ReceivePurchaseOrderRequest = components['schemas']['ReceivePurchaseOrderRequest']
export type PurchaseSuggestion = components['schemas']['PurchaseSuggestionResponse']

// Comprobantes electrónicos: datos fiscales, boletas y facturas.
export type BillingSettings = components['schemas']['BillingSettingsResponse']
export type BillingSettingsRequest = components['schemas']['BillingSettingsRequest']
export type CertificateUploadRequest = components['schemas']['CertificateUploadRequest']
/** Los archivos de un comprobante que sirve RestHub: el PDF, el XML firmado y la constancia de SUNAT (CDR). */
export type InvoiceDocumentFormat = components['schemas']['DocumentFormat']
export type Invoice = components['schemas']['InvoiceResponse']
export type BillingCapabilities = components['schemas']['BillingCapabilitiesResponse']
export type SendInvoiceEmailRequest = components['schemas']['SendInvoiceEmailRequest']
export type SendInvoiceEmailResponse = components['schemas']['SendInvoiceEmailResponse']
export type InvoicePage = components['schemas']['InvoicePageResponse']
export type IssueInvoiceRequest = components['schemas']['IssueInvoiceRequest']
export type InvoiceKind = components['schemas']['InvoiceKind']
// El backend tiene dos enums con este nombre (comprobantes y consulta); el contrato los distingue por módulo, pero ambos valen "none" | "dni" | "ce" | "ruc".
export type DocumentType = components['schemas']['DocumentType-Input']

// Clientes frecuentes y reservas de mesa.
export type Customer = components['schemas']['CustomerResponse']
export type CustomerRequest = components['schemas']['CustomerRequest']
/** Teléfono y correo completos de un cliente, tras pedir «Ver completo». */
export type CustomerContact = components['schemas']['CustomerContactResponse']

// Consulta de RUC/DNI a través de Factiliza (un tercero), solo cuando la persona la pide.
export type DocumentLookup = components['schemas']['DocumentLookupResponse']
export type LookupDocumentType = DocumentLookup['document_type']

// Bitácora del restaurante: lo que hizo cada cuenta del personal.
export type ActivityEntry = components['schemas']['ActivityResponse']
export type ActivityKind = components['schemas']['ActivityKind']
export type ActivityGroup = components['schemas']['ActivityGroup']
export type ActivityParams = NonNullable<operations['read_activity_api_v1_activity_get']['parameters']['query']>
export type Reservation = components['schemas']['ReservationResponse']
export type ReservationRequest = components['schemas']['ReservationRequest']
export type ReservationStatus = components['schemas']['ReservationStatus']

// Administración del sistema (`/platform`): el equipo de RestHub, sus
// restaurantes, sus encargados y la bitácora.
export type PlatformAdmin = PlatformSession['admin']
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
export type PreviewAs = components['schemas']['PreviewAs']
export type PreviewRequest = components['schemas']['PreviewRequest']
export type PreviewCodeResponse = components['schemas']['PreviewCodeResponse']
export type PreviewExchangeRequest = components['schemas']['PreviewExchangeRequest']

// Panel de observabilidad (`/platform/observability`): tráfico, errores,
// latencias y logs que el backend guarda de sí mismo.
type ObsQuery<TOperation extends keyof operations> = NonNullable<operations[TOperation]['parameters']['query']>

export type ObsWindow = components['schemas']['Window']
export type ObsLogLevel = components['schemas']['LogLevel']
export type ObsRouteSort = components['schemas']['RouteSort']
/** `error_rate` es una fracción de 0 a 1 (5xx sobre el total); una ventana vacía viene en cero. */
export type ObsSummary = components['schemas']['ObservabilitySummaryResponse']
export type ObsTimeseries = components['schemas']['TimeseriesResponse']
export type ObsTimePoint = components['schemas']['TimePointResponse']
export type ObsRouteStats = components['schemas']['RouteStatsResponse']
export type ObsStatusCount = components['schemas']['StatusCountResponse']
export type ObsLogEntry = components['schemas']['LogEntryResponse']
export type ObsLogDetail = components['schemas']['LogDetailResponse']
export type ObsRequestEntry = components['schemas']['RequestEntryResponse']
export type ObsAccountKind = ObsRequestEntry['account_kind']
export type ObsWindowParams = ObsQuery<'read_summary_api_v1_platform_observability_summary_get'>
export type ObsRoutesParams = ObsQuery<'read_routes_api_v1_platform_observability_routes_get'>
export type ObsLogsParams = ObsQuery<'search_logs_api_v1_platform_observability_logs_get'>
export type ObsRequestsParams = ObsQuery<'search_requests_api_v1_platform_observability_requests_get'>
