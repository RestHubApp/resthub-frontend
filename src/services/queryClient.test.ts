import { afterEach, describe, expect, it } from '@jest/globals'

import { clearQueriesExcept, clearQueriesOf, PLATFORM_QUERY_ROOT, queryClient } from './queryClient'

const ORDERS = ['orders'] as const
const RESTAURANTS = [PLATFORM_QUERY_ROOT, 'restaurants'] as const

const PASSWORD = 'x'.repeat(12)

// Una mutación terminada en el caché, con lo que se envió como variables: así
// queda después de un alta, contraseña incluida.
async function mutation(mutationKey: readonly unknown[] | undefined, variables: unknown): Promise<void> {
  const fresh = queryClient
    .getMutationCache()
    .build(queryClient, { mutationKey, mutationFn: () => Promise.resolve(null) })
  await fresh.execute(variables)
}

function mutationsKeys(): unknown[] {
  return queryClient
    .getMutationCache()
    .getAll()
    .map((m) => m.options.mutationKey?.[0])
}

async function fill(): Promise<void> {
  queryClient.setQueryData(ORDERS, { items: [] })
  queryClient.setQueryData(RESTAURANTS, { items: [] })
  await mutation(['orders', 'create'], { table: 1 })
  await mutation(undefined, { note: 'sin clave' })
  await mutation([...RESTAURANTS, 'owners', 'add'], { password: PASSWORD })
}

afterEach(() => {
  queryClient.clear()
})

describe('clearQueriesExcept', () => {
  it('borra consultas y mutaciones del restaurante y deja las de plataforma', async () => {
    await fill()

    clearQueriesExcept(PLATFORM_QUERY_ROOT)

    expect(queryClient.getQueryData(ORDERS)).toBeUndefined()
    expect(queryClient.getQueryData(RESTAURANTS)).toEqual({ items: [] })
    expect(mutationsKeys()).toEqual([PLATFORM_QUERY_ROOT])
  })
})

describe('clearQueriesOf', () => {
  it('borra solo consultas y mutaciones de plataforma, con sus contraseñas', async () => {
    await fill()

    clearQueriesOf(PLATFORM_QUERY_ROOT)

    expect(queryClient.getQueryData(RESTAURANTS)).toBeUndefined()
    expect(queryClient.getQueryData(ORDERS)).toEqual({ items: [] })
    expect(mutationsKeys()).toEqual(['orders', undefined])
    const variables = queryClient.getMutationCache().getAll().map((m) => m.state.variables)
    expect(JSON.stringify(variables)).not.toContain(PASSWORD)
  })
})
