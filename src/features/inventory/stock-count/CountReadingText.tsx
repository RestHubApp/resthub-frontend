import type { StockCountLine } from '@/api/types'
import { type CountReading, readingText } from './countEntry'

interface CountReadingTextProps {
  readonly id: string
  readonly reading: CountReading
  readonly line: StockCountLine
}

/** La conversión en vivo («= 2.25 L») o por qué todavía no se puede guardar. Se anuncia sin interrumpir. */
export function CountReadingText({ id, reading, line }: CountReadingTextProps) {
  const tone = reading.error === null ? 'text-muted-foreground' : 'text-destructive'
  return (
    <p id={id} aria-live="polite" className={`m-0 min-h-5 text-sm ${tone}`}>
      {reading.error ?? readingText(reading, line)}
    </p>
  )
}
