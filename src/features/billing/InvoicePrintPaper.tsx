import type { BillingSettings, Invoice } from '@/api/types'
import { Icon } from '@/components/Icon'
import * as icons from '@/components/icons'
import { PRINT_CSS } from '@/components/printSheet'
import { Button } from '@/components/ui/button'
import { InvoiceSheet } from './InvoiceSheet'

interface InvoicePrintPaperProps {
  readonly invoice: Invoice
  readonly settings: BillingSettings | null
  readonly timeZone: string
}

/** El título accesible, el botón de imprimir y la hoja del comprobante. */
export function InvoicePrintPaper({ invoice, settings, timeZone }: InvoicePrintPaperProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <style>{PRINT_CSS}</style>
      {/* La hoja no lleva título visible; el lector de pantalla sí lo necesita. */}
      <h1 className="sr-only">{`Comprobante ${invoice.code}`}</h1>
      <Button type="button" className="print:hidden" onClick={() => {
        window.print()
      }}>
        <Icon glyph={icons.print} size={16} />
        <span>Imprimir</span>
      </Button>
      <article id="hoja-impresa" className="w-[74mm] bg-white p-3 font-mono text-black shadow-md">
        <InvoiceSheet invoice={invoice} settings={settings} timeZone={timeZone} />
      </article>
    </div>
  )
}
