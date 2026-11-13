// @tgwf/co2 no publica tipos. Solo se declara lo que usan `grade.ts` y `sci.ts`.
declare module '@tgwf/co2' {
  interface Co2Options {
    readonly model: 'swd' | '1byte'
    readonly version?: 3 | 4
    /** Con `true`, `perVisit` devuelve también la nota (A+ a F) de la escala de Website Carbon. */
    readonly rating?: boolean
  }

  /** Por segmento del sistema: centro de datos, red y dispositivo de quien visita. */
  interface PerSegment {
    readonly dataCenter: number
    readonly network: number
    readonly device: number
  }

  /** Con `results: 'segment'`: los gramos separados en operación y fabricación. */
  interface SegmentedEmissions {
    readonly total: number
    readonly totalOperationalCO2e: number
    readonly totalEmbodiedCO2e: number
  }

  interface SegmentedModel {
    perVisit: (bytes: number, green?: boolean) => SegmentedEmissions
    /** El modelo SWD v4 por dentro; de él sale la energía (kWh) de la transferencia. */
    readonly model: { operationalEnergyPerSegment: (bytes: number) => PerSegment }
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
  export const co2: {
    new (options: Co2Options & { readonly results: 'segment' }): SegmentedModel
    new (options: Co2Options): Co2Model
  }
}
