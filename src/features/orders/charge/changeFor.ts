import { amountCents } from './chargeSchema'

/** El vuelto de pagar `amount` una cuenta de `dueCents`, o `null` si no alcanza. */
export function changeFor(dueCents: number, amount: string): number | null {
  if (amount.trim() === '') {
    return 0
  }
  const cents = amountCents(amount)
  return cents === null || cents < dueCents ? null : cents - dueCents
}
