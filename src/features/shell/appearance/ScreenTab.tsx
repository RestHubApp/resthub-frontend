import { SectionHeading } from '@/components/SectionHeading'
import { AccentPicker } from './AccentPicker'
import { ContrastToggle } from './ContrastToggle'
import { ModePicker } from './ModePicker'

/** La pestaña «Pantalla»: modo, color de acento y alto contraste. */
export function ScreenTab() {
  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-2">
        <SectionHeading>Modo</SectionHeading>
        <ModePicker />
      </section>
      <section className="flex flex-col gap-2">
        <SectionHeading>Color</SectionHeading>
        <AccentPicker />
      </section>
      <ContrastToggle />
    </div>
  )
}
