// PROVISIONAL, escrito a mano: el API del administrador del sistema
// (`/api/v1/platform/*`) todavía no está en el OpenAPI versionado.
//
// Estas formas repiten el contrato de la parte 2 («administrador del
// sistema») campo por campo. En cuanto el backend publique esos endpoints,
// se regenera `schema.d.ts` (`pnpm generate:api`) y cada tipo de este archivo
// se reemplaza por su alias de `components['schemas'][...]` en `types.ts`,
// igual que los demás; después se borra este archivo. `pnpm build` señala
// cualquier pantalla que haya quedado desalineada.

/** La cuenta del equipo de RestHub. No pertenece a ningún restaurante. */
export interface PlatformAdmin {
  id: number
  full_name: string
  email: string
}

export interface PlatformLoginRequest {
  email: string
  password: string
}

/** `POST /platform/auth/login` y `POST /platform/auth/refresh`. */
export interface PlatformTokenResponse {
  access_token: string
  token_type: 'bearer'
  expires_in: number
  admin: PlatformAdmin
}

/** `GET /platform/auth/me`. */
export interface PlatformMeResponse {
  admin: PlatformAdmin
}

export interface PlatformRestaurantSummary {
  id: number
  name: string
  slug: string
  timezone: string
  is_active: boolean
  created_at: string
  staff_count: number
  active_staff_count: number
}

/** `GET /platform/restaurants`, ordenados por `created_at` de más nuevo a más viejo. */
export interface PlatformRestaurantPage {
  items: PlatformRestaurantSummary[]
  total: number
}

export interface PlatformRestaurantListParams {
  /** Filtra por nombre o identificador, sin distinguir mayúsculas. */
  search?: string
  limit?: number
  offset?: number
}

/** Una cuenta con el rol Encargado de ese restaurante. */
export interface PlatformOwner {
  id: number
  full_name: string
  email: string
  is_active: boolean
}

export interface PlatformRestaurantDetail extends PlatformRestaurantSummary {
  owners: PlatformOwner[]
}

/** La primera cuenta del restaurante, o un encargado más. */
export interface PlatformOwnerRequest {
  full_name: string
  email: string
  password: string
}

export interface CreatePlatformRestaurantRequest {
  name: string
  slug: string
  timezone: string
  owner: PlatformOwnerRequest
}

export interface UpdatePlatformRestaurantRequest {
  name?: string
  timezone?: string
  is_active?: boolean
}

export interface PlatformActivityEntry {
  id: number
  admin_id: number
  admin_name: string
  kind: string
  kind_label: string
  detail: string
  created_at: string
}

export interface PlatformActivityPage {
  items: PlatformActivityEntry[]
  total: number
}

export interface PlatformActivityParams {
  limit?: number
  offset?: number
}
