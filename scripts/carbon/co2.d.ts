// @tgwf/co2 no publica tipos. Solo se declara lo que usa `grade.ts`.
declare module '@tgwf/co2' {
  interface Co2Options {
    readonly model: 'swd' | '1byte'
    readonly version?: 3 | 4
    /** Con `true`, `perVisit` devuelve también la nota (A+ a F) de la escala de Website Carbon. */
    readonly rating?: boolean
  }

  interface RatedEmissions {
    readonly total: number
    readonly rating: string
  }

  interface Co2Model {
    /** Una primera visita: los gramos de CO2e y la nota. */
    perVisit: (bytes: number, green?: boolean) => RatedEmissions
  }

  /** La clase de la librería, que se exporta en minúsculas. */
  export const co2: new (options: Co2Options) => Co2Model
}
