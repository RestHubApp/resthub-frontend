import { Link } from 'react-router'

import { useHashFocus } from '@/hooks/useHashFocus'
import { paths, PRIVACY_RIGHTS_ANCHOR } from '@/services/paths'

/**
 * La versión de este texto. Es la misma que `PRIVACY_VERSION` en el backend
 * (`accounts/domain/entities.py`), que rechaza cualquier otra al aceptarla; es
 * independiente de `TERMS_VERSION`. Si el texto cambia de fondo, cambian las
 * dos en el mismo despliegue y cada cuenta vuelve a aceptarlo al entrar.
 */
export const PRIVACY_VERSION = '2026-10'

interface Section {
  /** Ancla estable de la sección, para enlazarla desde otras pantallas. */
  readonly id: string
  readonly title: string
  readonly paragraphs: readonly string[]
}

// Ley N.º 29733, Ley de Protección de Datos Personales del Perú.
const SECTIONS: readonly Section[] = [
  {
    id: 'responsable',
    title: 'Quién trata tus datos',
    paragraphs: [
      'Cada restaurante que usa RestHub es el titular de los datos de sus clientes y de su personal, y decide para qué los usa. RestHub es el encargado del tratamiento: guarda y procesa esos datos solo para dar el servicio al restaurante.',
      'Cuando una persona del restaurante pide buscar un RUC o un DNI, esa consulta se hace a través de Factiliza, un tercero que actúa como encargado de tratamiento; solo se envía el número buscado.',
      'Cuando el restaurante envía un comprobante por correo, el envío se hace a través de Brevo, y el respaldo de los comprobantes (XML y PDF) se guarda en Google Drive; ambos son terceros que actúan como encargados de tratamiento, y el correo solo sale cuando el usuario lo pide.',
    ],
  },
  {
    id: 'datos',
    title: 'Qué datos se guardan',
    paragraphs: [
      'De los clientes: nombre, teléfono, correo, dirección de entrega, referencia y notas (que pueden incluir alergias, un dato de salud), sus pedidos y sus comprobantes.',
      'Del personal: nombre, correo, rol, contraseña cifrada y la bitácora de lo que hace en el sistema.',
    ],
  },
  {
    id: 'finalidad',
    title: 'Para qué',
    paragraphs: [
      'Para tomar, preparar, entregar y cobrar pedidos, emitir comprobantes, gestionar reservas y recordar las preferencias del cliente en sus próximas visitas. No se venden ni se usan para publicidad.',
    ],
  },
  {
    id: 'consentimiento',
    title: 'Consentimiento',
    paragraphs: [
      'Un cliente solo queda en la libreta del restaurante si acepta que se guarden sus datos. Queda anotado cuándo lo aceptó, sobre qué versión del texto y quién lo registró. Sin su consentimiento, el pedido se atiende igual y no se guarda en la libreta.',
    ],
  },
  {
    id: 'inteligencia-artificial',
    title: 'Inteligencia artificial y envíos fuera del Perú',
    paragraphs: [
      'Para detectar alergias en las notas de los pedidos, clasificar las mermas y sugerir compras, el texto se envía a TypeSafe AI o, por su misma interfaz, a OpenRouter; ambos están fuera del Perú. Antes de enviarlo se quitan los nombres, teléfonos, correos y números de documento. Cada restaurante puede apagar este envío; entonces deciden reglas fijas y nada sale del sistema.',
      'El servicio se aloja fuera del Perú: la aplicación y la base de datos en Railway, y las pantallas en Vercel. El respaldo diario de la base se guarda 30 días en GitHub, y el de los comprobantes (XML y PDF), en Google Drive. Los correos salen por Brevo y las consultas de RUC o DNI, por Factiliza.',
      'Los comprobantes electrónicos se firman y se envían a la SUNAT a través de Lycet, que corre en Microsoft Azure. Todos estos proveedores actúan como encargados de tratamiento y reciben solo lo necesario para su parte del servicio.',
    ],
  },
  {
    id: 'conservacion',
    title: 'Cuánto tiempo se conservan',
    paragraphs: [
      'Mientras el restaurante use el servicio o hasta que el titular pida su eliminación. Los comprobantes electrónicos se conservan el tiempo que exige la normativa tributaria, aunque el cliente pida que se borren sus demás datos.',
    ],
  },
  {
    id: PRIVACY_RIGHTS_ANCHOR,
    title: 'Tus derechos (ARCO)',
    paragraphs: [
      'Puedes pedir al restaurante acceder a tus datos, rectificarlos, cancelarlos (que se borren) u oponerte a su tratamiento. El restaurante lo atiende desde RestHub y cada pedido queda registrado. Si no te responden, puedes acudir a la Autoridad Nacional de Protección de Datos Personales.',
    ],
  },
  {
    id: 'seguridad',
    title: 'Cómo se protegen',
    paragraphs: [
      'Conexión cifrada (HTTPS), contraseñas guardadas con Argon2id, y el teléfono, la dirección, la referencia y las notas de clientes, pedidos y reservas cifrados en la base con AES-256-GCM. Además, acceso por permisos según el rol, datos separados entre restaurantes y una bitácora que no se puede editar ni borrar.',
    ],
  },
]

/**
 * Política de privacidad (Ley N.º 29733).
 *
 * Pública: se abre sin sesión, desde el acceso o desde la pantalla que pide
 * aceptarla. Los términos y condiciones del servicio están aparte, en `/terminos`.
 */
export function PrivacyView() {
  useHashFocus()

  return (
    // Se dibuja dentro del armazón, que ya tiene su <main>: un artículo y no otro.
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-2">
      <header className="flex flex-col gap-2">
        <h1 className="m-0 font-heading text-2xl font-bold sm:text-3xl">Política de privacidad</h1>
        <p className="m-0 text-sm text-muted-foreground">
          {`Versión ${PRIVACY_VERSION}. Conforme a la Ley N.º 29733, Ley de Protección de Datos Personales del Perú.`}
        </p>
      </header>
      {SECTIONS.map((section) => (
        <section key={section.id} id={section.id} tabIndex={-1} className="flex scroll-mt-4 flex-col gap-2 outline-none">
          <h2 className="m-0 text-lg font-semibold">{section.title}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="m-0 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
      <p className="m-0">
        <Link to={paths.terms} className="inline-flex min-h-11 items-center underline underline-offset-4">
          Términos y condiciones del servicio
        </Link>
      </p>
      <p className="m-0">
        <Link to={paths.home} className="inline-flex min-h-11 items-center underline underline-offset-4">
          Volver a RestHub
        </Link>
      </p>
    </article>
  )
}
