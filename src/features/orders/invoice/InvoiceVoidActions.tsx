import { Suspense, useState } from 'react'

import { PERMISSION } from '@/api/permissions'
import type { Invoice } from '@/api/types'
import { lazyNamed } from '@/components/lazyNamed'
import { Button } from '@/components/ui/button'
import { useCan } from '@/store/session'
import type { InvoiceVoidMode } from './InvoiceVoidDialog'

const InvoiceVoidDialog = lazyNamed(() => import('./InvoiceVoidDialog'), 'InvoiceVoidDialog')

/**
 * «Cambiar comprobante» y «Anular comprobante», para quien maneja la
 * facturación. Un comprobante ya anulado, o con su nota de crédito en curso,
 * no los ofrece: lo suyo es emitir otro o reenviar la nota.
 */
export function InvoiceVoidActions({ invoice }: { readonly invoice: Invoice }) {
  const canManage = useCan(PERMISSION.billingManage)
  const [mode, setMode] = useState<InvoiceVoidMode | null>(null)
  if (!canManage || invoice.is_voided || invoice.credit_note !== null) {
    return null
  }

  return (
    <>
      <Button type="button" variant="ghost" size="sm" onClick={() => {
        setMode('change')
      }}>
        Cambiar comprobante
      </Button>
      <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => {
        setMode('void')
      }}>
        Anular comprobante
      </Button>
      <Suspense fallback={null}>
        {mode === null ? null : <InvoiceVoidDialog invoice={invoice} mode={mode} onClose={() => {
          setMode(null)
        }} />}
      </Suspense>
    </>
  )
}
