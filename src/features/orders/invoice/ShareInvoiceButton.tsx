import type { Invoice } from '@/api/types'
import { FormMessage } from '@/components/FormMessage'
import { Icon } from '@/components/Icon'
import * as icons from '@/components/icons'
import { Button } from '@/components/ui/button'
import { useStaffAccount } from '@/store/session'
import { useShareInvoice } from './useShareInvoice'

function labelOf(isPending: boolean, isReady: boolean): string {
  if (isPending) return 'Preparando…'
  return isReady ? 'Tocar para compartir' : 'Compartir comprobante'
}

/** «Compartir comprobante»: manda el PDF como archivo desde la hoja de compartir del celular. */
export function ShareInvoiceButton({ invoice }: { readonly invoice: Invoice }) {
  const restaurantName = useStaffAccount()?.restaurant.name ?? ''
  const { share, isPending, isReady, error } = useShareInvoice(invoice, restaurantName)

  return (
    <>
      <Button type="button" variant="ghost" size="sm" disabled={isPending} onClick={share}>
        <Icon glyph={icons.send} size={14} />
        <span>{labelOf(isPending, isReady)}</span>
      </Button>
      {error === null ? null : (
        <div className="basis-full">
          <FormMessage tone="error">{error}</FormMessage>
        </div>
      )}
    </>
  )
}
