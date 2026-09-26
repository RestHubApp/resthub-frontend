import { afterEach, describe, expect, it } from 'vitest'

import { clearQueriesExcept, clearQueriesOf, PLATFORM_QUERY_ROOT, queryClient } from './queryClient'

const PEDIDOS = ['orders'] as const
const RESTAURANTES = [PLATFORM_QUERY_ROOT, 'restaurants'] as const

const CLAVE = 'x'.repeat(12)

// Una mutación terminada en el caché, con lo que se envió como variables: así
// queda después de un alta, contraseña incluida.
async function mutacion(mutationKey: readonly unknown[] | undefined, variables: unknown): Promise<void> {
  const nueva = queryClient
    .getMutationCache()
    .build(queryClient, { mutationKey, mutationFn: () => Promise.resolve(null) })
  await nueva.execute(variables)
}

function clavesDeMutaciones(): unknown[] {
  return queryClient
    .getMutationCache()
    .getAll()
    .map((m) => m.options.mutationKey?.[0])
}

async function llenar(): Promise<void> {
  queryClient.setQueryData(PEDIDOS, { items: [] })
  queryClient.setQueryData(RESTAURANTES, { items: [] })
  await mutacion(['orders', 'create'], { table: 1 })
  await mutacion(undefined, { note: 'sin clave' })
  await mutacion([...RESTAURANTES, 'owners', 'add'], { password: CLAVE })
}

afterEach(() => {
  queryClient.clear()
})

describe('clearQueriesExcept', () => {
  it('borra consultas y mutaciones del restaurante y deja las de plataforma', async () => {
    await llenar()

    clearQueriesExcept(PLATFORM_QUERY_ROOT)

    expect(queryClient.getQueryData(PEDIDOS)).toBeUndefined()
    expect(queryClient.getQueryData(RESTAURANTES)).toEqual({ items: [] })
    expect(clavesDeMutaciones()).toEqual([PLATFORM_QUERY_ROOT])
  })
})

describe('clearQueriesOf', () => {
  it('borra solo consultas y mutaciones de plataforma, con sus contraseñas', async () => {
    await llenar()

    clearQueriesOf(PLATFORM_QUERY_ROOT)

    expect(queryClient.getQueryData(RESTAURANTES)).toBeUndefined()
    expect(queryClient.getQueryData(PEDIDOS)).toEqual({ items: [] })
    expect(clavesDeMutaciones()).toEqual(['orders', undefined])
    const variables = queryClient.getMutationCache().getAll().map((m) => m.state.variables)
    expect(JSON.stringify(variables)).not.toContain(CLAVE)
  })
})
