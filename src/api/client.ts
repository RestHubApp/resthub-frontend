import { call, type ApiClient, type ApiResult, type CallOptions } from '@/services/api'
import type { ApiPaths } from './types'

/**
 * Una petición al contrato del backend, tipada de punta a punta.
 *
 * `run` elige método y ruta con el cliente (`client.GET('/api/v1/tables')`): el
 * compilador revisa que la ruta exista, los parámetros y el cuerpo que se
 * envía y el tipo de lo que se devuelve. El cliente, la credencial, el plazo
 * y los errores son de `src/services/api.ts`.
 */
export function send<TData, TError>(
  run: (client: ApiClient<ApiPaths>) => Promise<ApiResult<TData, TError>>,
  options?: CallOptions,
): Promise<TData> {
  return call(run, options)
}
