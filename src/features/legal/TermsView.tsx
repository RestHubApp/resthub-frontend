import { Link } from 'react-router'

import { useHashFocus } from '@/hooks/useHashFocus'
import { paths } from '@/services/paths'

/**
 * La versión de este texto. Es la misma que `TERMS_VERSION` en el backend
 * (`accounts/domain/entities.py`): si el texto cambia, cambian las dos y cada
 * cuenta vuelve a aceptarlo al entrar.
 */
export const TERMS_VERSION = '2026-10-15'

// Marcadores que el dueño del proyecto completa antes de usar el texto con clientes reales.
const OWNER_PLACEHOLDER = '[Razón social y RUC del titular]'
const CONTACT_PLACEHOLDER = '[Correo de contacto]'
const CITY_PLACEHOLDER = '[Ciudad]'

interface Section {
  /** Ancla estable de la sección, para enlazarla desde el índice y desde otras pantallas. */
  readonly id: string
  readonly title: string
  readonly paragraphs: readonly string[]
}

// Texto preparado para el proyecto: debe revisarlo un abogado antes de usarse con
// clientes reales. No se muestra en la página pública a propósito; queda aquí y
// en la descripción del PR.
const SECTIONS: readonly Section[] = [
  {
    id: 'servicio',
    title: 'Qué es RestHub y quién lo presta',
    paragraphs: [
      'RestHub es un sistema web para restaurantes: sirve para tomar pedidos, llevar la cocina, la caja, el inventario y las reservas, y para emitir comprobantes electrónicos. En estos términos, «el restaurante» es el negocio que contrata y usa RestHub, y «RestHub» es el servicio que se le presta.',
      `RestHub es un proyecto desarrollado por su equipo. Lo presta ${OWNER_PLACEHOLDER}.`,
      'Quien acepta estos términos declara que puede obligar al restaurante o que trabaja en él con permiso del encargado.',
    ],
  },
  {
    id: 'cuentas',
    title: 'Cuentas y acceso',
    paragraphs: [
      'Las cuentas las crea el encargado del restaurante. Cada cuenta es personal e intransferible: la usa solo la persona a la que se le dio, con su correo y su contraseña.',
      'Cuida tu contraseña y no la compartas. Si crees que alguien más la conoce, cámbiala desde tu perfil o avisa al encargado. Todo lo que se haga con tu cuenta queda a tu nombre.',
      'Lo que cada persona puede ver o hacer depende de su rol y de los permisos que el encargado le dio. Cierra la sesión cuando uses un equipo que no es tuyo.',
      'La administración del sistema (crear restaurantes, suspenderlos o revisar el estado del servicio) la hace el equipo de RestHub desde un acceso aparte, y sus acciones también quedan registradas.',
    ],
  },
  {
    id: 'uso-aceptable',
    title: 'Uso aceptable',
    paragraphs: [
      'RestHub se usa solo para trabajar en el restaurante. No está permitido entrar a datos de clientes sin que el servicio lo necesite, copiarlos o enviarlos fuera del sistema, intentar vulnerar la seguridad o saltarse los permisos, ni compartir cuentas entre personas.',
      'Lo que cada persona hace en el sistema queda en la bitácora, que no se puede editar ni borrar, y el sistema puede avisar de accesos fuera de lo normal. Un uso que incumpla estos términos puede llevar a la suspensión de la cuenta.',
    ],
  },
  {
    id: 'responsabilidades',
    title: 'Responsabilidades del restaurante',
    paragraphs: [
      'El restaurante es responsable de que los datos que registra sean verdaderos y estén al día, en especial sus datos fiscales y su régimen tributario, de los que dependen sus comprobantes.',
      'Los comprobantes electrónicos se firman con el certificado digital del restaurante y se envían a la SUNAT con sus credenciales SOL, que RestHub guarda cifradas. El restaurante responde por su contenido, por sus precios, por su carta y por lo que escribe en el sistema.',
      'El restaurante también responde de contar con el consentimiento de sus clientes antes de guardar sus datos personales, como explica la política de privacidad.',
    ],
  },
  {
    id: 'disponibilidad',
    title: 'Disponibilidad y funcionamiento sin conexión',
    paragraphs: [
      'Se procura que RestHub funcione todo el tiempo, pero no se garantiza un servicio ininterrumpido. Puede haber mantenimientos, cortes de internet o fallas de los servicios en que se apoya.',
      'Si se pierde la conexión, algunas acciones se guardan en una cola en el equipo y se envían cuando vuelve la conexión. Mientras tanto no están en el servidor; por eso conviene no cerrar la sesión ni limpiar los datos del navegador con acciones pendientes.',
      'Se hacen respaldos periódicos de la información, pero el restaurante debe conservar por su cuenta lo que necesite tener siempre a mano.',
    ],
  },
  {
    id: 'terceros',
    title: 'Servicios de terceros',
    paragraphs: [
      'RestHub se apoya en otros servicios: Railway y Vercel para el alojamiento, un servicio de facturación propio (Lycet) y la SUNAT para los comprobantes, Factiliza para consultar RUC y DNI, Brevo para enviar correos, Google Drive para el respaldo de comprobantes y, si el restaurante los tiene activados, proveedores de inteligencia artificial a través de OpenRouter.',
      'El uso de esos servicios se rige además por sus propias condiciones. Cómo se tratan los datos personales en ellos se explica en la política de privacidad.',
    ],
  },
  {
    id: 'propiedad-datos',
    title: 'Propiedad y datos del restaurante',
    paragraphs: [
      'Los datos que el restaurante registra en RestHub son del restaurante. RestHub los guarda y procesa para prestar el servicio, no los vende ni los usa para publicidad.',
      'El restaurante puede pedir una copia de sus datos y pedir su baja cuando quiera.',
      'RestHub, su diseño y su código son del equipo que lo desarrolló; usar el servicio no transfiere esos derechos.',
    ],
  },
  {
    id: 'responsabilidad',
    title: 'Limitación de responsabilidad',
    paragraphs: [
      'RestHub se presta con el cuidado razonable que corresponde. No responde por las decisiones que el restaurante tome con base en los indicadores o en las sugerencias de inteligencia artificial, que son una ayuda y no reemplazan su criterio, ni por las fallas de servicios de terceros.',
      'Esta limitación no se aplica en caso de dolo o culpa grave, ni a lo que la ley no permita limitar.',
    ],
  },
  {
    id: 'suspension',
    title: 'Suspensión y baja',
    paragraphs: [
      'El servicio puede suspenderse a un restaurante o a una cuenta si se incumplen estos términos, y se da de baja cuando el restaurante lo pide.',
      'Al darse de baja, los datos se eliminan o se anonimizan, salvo los comprobantes electrónicos y los registros que la ley exige conservar por un tiempo; esos se guardan solo por ese plazo.',
    ],
  },
  {
    id: 'cambios',
    title: 'Cambios en los términos',
    paragraphs: [
      'Estos términos pueden cambiar. Cada texto nuevo lleva una versión distinta y, al entrar, el sistema pide aceptarlo otra vez antes de seguir. Si no lo aceptas, no puedes seguir usando el servicio.',
    ],
  },
  {
    id: 'ley-aplicable',
    title: 'Ley aplicable y controversias',
    paragraphs: [
      `Estos términos se rigen por las leyes de la República del Perú, incluido el Código de Protección y Defensa del Consumidor cuando corresponda. Las controversias se someten a los jueces de ${CITY_PLACEHOLDER}, sin perjuicio de los derechos que la ley reconozca a quien consume.`,
    ],
  },
  {
    id: 'contacto',
    title: 'Contacto',
    paragraphs: [`Para consultas sobre estos términos escribe a ${CONTACT_PLACEHOLDER}.`],
  },
]

/**
 * Términos y condiciones del servicio.
 *
 * Pública: se abre sin sesión, desde el pie o desde la pantalla «Antes de
 * empezar», cuya casilla de términos enlaza aquí. Cada sección tiene un ancla
 * estable y un índice al inicio.
 */
export function TermsView() {
  useHashFocus()

  return (
    // Se dibuja dentro del armazón, que ya tiene su <main>: un artículo y no otro.
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-2">
      <header className="flex flex-col gap-2">
        <h1 className="m-0 font-heading text-2xl font-bold sm:text-3xl">Términos y condiciones del servicio</h1>
        <p className="m-0 text-sm text-muted-foreground">{`Versión ${TERMS_VERSION}.`}</p>
      </header>
      <nav aria-label="Índice de secciones">
        <ol className="m-0 flex list-decimal flex-col pl-6">
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <Link
                to={`${paths.terms}#${section.id}`}
                className="inline-flex min-h-11 items-center underline underline-offset-4"
              >
                {section.title}
              </Link>
            </li>
          ))}
        </ol>
      </nav>
      {SECTIONS.map((section, index) => (
        <section key={section.id} id={section.id} tabIndex={-1} className="flex scroll-mt-4 flex-col gap-2 outline-none">
          <h2 className="m-0 text-lg font-semibold">{`${String(index + 1)}. ${section.title}`}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="m-0 leading-relaxed">
              {paragraph}
            </p>
          ))}
          {section.id === 'terceros' ? (
            <p className="m-0">
              <Link to={paths.privacy} className="inline-flex min-h-11 items-center underline underline-offset-4">
                Política de privacidad
              </Link>
            </p>
          ) : null}
        </section>
      ))}
      <p className="m-0">
        <Link to={paths.home} className="inline-flex min-h-11 items-center underline underline-offset-4">
          Volver a RestHub
        </Link>
      </p>
    </article>
  )
}
