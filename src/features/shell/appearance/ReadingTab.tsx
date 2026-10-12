import { SectionHeading } from '@/components/SectionHeading'
import { openAccessibilityMenu } from '@/components/accessibilityMenu'
import { Button } from '@/components/ui/button'
import { DensityPicker } from './DensityPicker'
import { FontPicker } from './FontPicker'
import { TextSizePicker } from './TextSizePicker'

/** La pestaña «Lectura»: tamaño del texto, letra y, con ratón, la densidad. */
export function ReadingTab() {
  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-2">
        <SectionHeading description="Más grande el texto y los botones, en todas las pantallas.">Tamaño del texto</SectionHeading>
        <TextSizePicker />
      </section>
      <section className="flex flex-col gap-2">
        <SectionHeading>Letra</SectionHeading>
        <FontPicker />
      </section>
      <DensityPicker />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted px-4 py-3 text-sm">
        <p className="m-0 max-w-prose text-muted-foreground">
          Hay más ayudas de lectura, como el espaciado entre letras y líneas.
        </p>
        <Button type="button" variant="outline" onClick={openAccessibilityMenu}>
          Más ajustes de accesibilidad
        </Button>
      </div>
    </div>
  )
}
