import { afterEach, describe, expect, it } from '@jest/globals'

import { clearQueries, PLATFORM_QUERY_ROOT, queryClient } from './queryClient'

const ORDERS = ['orders'] as const
const RESTAURANTS = [PLATFORM_QUERY_ROOT, 'restaurants'] as const

const PASSWORD = 'x'.repeat(12)

// Una mutación terminada en el caché, con lo que se envió como variables: así
// queda después de un alta, contraseña incluida.
async function mutation(mutationKey: readonly unknown[] | undefined, variables: unknown): Promise<void> {
  const fresh = queryClient
    .getMutationCache()
    .build(queryClient, { ...(mutationKey === undefined ? {} : { mutationKey }), mutationFn: () => Promise.resolve(null) })
  await fresh.execute(variables)
}

afterEach(() => {
  queryClient.clear()
})

describe('clearQueries', () => {
  it('borra consultas y mutaciones, las contraseñas enviadas incluidas', async () => {
    queryClient.setQueryData(ORDERS, { items: [] })
    queryClient.setQueryData(RESTAURANTS, { items: [] })
    await mutation(['orders', 'create'], { table: 1 })
    await mutation(undefined, { note: 'sin clave' })
    await mutation([...RESTAURANTS, 'owners', 'add'], { password: PASSWORD })

    clearQueries()

    expect(queryClient.getQueryData(ORDERS)).toBeUndefined()
    expect(queryClient.getQueryData(RESTAURANTS)).toBeUndefined()
    expect(queryClient.getMutationCache().getAll()).toEqual([])
  })
})
