import { Link } from 'react-router'

/**
 * La versión de este texto. Es la misma que `TERMS_VERSION` en el backend
 * (`accounts/domain/entities.py`): si el texto cambia, cambian las dos y cada
 * cuenta vuelve a aceptarlo al entrar.
 */
export const PRIVACY_VERSION = '2026-10'

interface Seccion {
  readonly titulo: string
  readonly parrafos: readonly string[]
}

// Ley N.º 29733, Ley de Protección de Datos Personales del Perú.
const SECCIONES: readonly Seccion[] = [
  {
    titulo: 'Quién trata tus datos',
    parrafos: [
      'Cada restaurante que usa RestHub es el titular de los datos de sus clientes y de su personal, y decide para qué los usa. RestHub es el encargado del tratamiento: guarda y procesa esos datos solo para dar el servicio al restaurante.',
    ],
  },
  {
    titulo: 'Qué datos se guardan',
    parrafos: [
      'De los clientes: nombre, teléfono, correo, dirección de entrega, referencia y notas (que pueden incluir alergias, un dato de salud), sus pedidos y sus comprobantes.',
      'Del personal: nombre, correo, rol, contraseña cifrada y la bitácora de lo que hace en el sistema.',
    ],
  },
  {
    titulo: 'Para qué',
    parrafos: [
      'Para tomar, preparar, entregar y cobrar pedidos, emitir comprobantes, gestionar reservas y recordar las preferencias del cliente en sus próximas visitas. No se venden ni se usan para publicidad.',
    ],
  },
  {
    titulo: 'Consentimiento',
    parrafos: [
      'Un cliente solo queda en la libreta del restaurante si acepta que se guarden sus datos. Queda anotado cuándo lo aceptó, sobre qué versión del texto y quién lo registró. Sin su consentimiento, el pedido se atiende igual y no se guarda en la libreta.',
    ],
  },
  {
    titulo: 'Inteligencia artificial y envíos fuera del Perú',
    parrafos: [
      'Para detectar alergias en las notas de los pedidos y clasificar las mermas, el texto se envía a TypeSafe AI, un proveedor fuera del Perú. Antes de enviarlo se quitan los nombres, teléfonos, correos y números de documento. Cada restaurante puede apagar este envío; entonces deciden reglas fijas y nada sale del sistema.',
    ],
  },
  {
    titulo: 'Cuánto tiempo se conservan',
    parrafos: [
      'Mientras el restaurante use el servicio o hasta que el titular pida su eliminación. Los comprobantes electrónicos se conservan el tiempo que exige la normativa tributaria, aunque el cliente pida que se borren sus demás datos.',
    ],
  },
  {
    titulo: 'Tus derechos (ARCO)',
    parrafos: [
      'Puedes pedir al restaurante acceder a tus datos, rectificarlos, cancelarlos (que se borren) u oponerte a su tratamiento. El restaurante lo atiende desde RestHub y cada pedido queda registrado. Si no te responden, puedes acudir a la Autoridad Nacional de Protección de Datos Personales.',
    ],
  },
  {
    titulo: 'Cómo se protegen',
    parrafos: [
      'Conexión cifrada (HTTPS), contraseñas guardadas con bcrypt, acceso por permisos según el rol, datos separados entre restaurantes y una bitácora que no se puede editar ni borrar.',
    ],
  },
]

/**
 * Términos de uso y política de privacidad (Ley N.º 29733).
 *
 * Pública: se abre sin sesión, desde el acceso o desde la pantalla que pide
 * aceptarlos.
 */
export default function PrivacyView() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-2">
        <h1 className="m-0 font-heading text-2xl font-bold sm:text-3xl">Términos de uso y política de privacidad</h1>
        <p className="m-0 text-sm text-muted-foreground">
          {`Versión ${PRIVACY_VERSION}. Conforme a la Ley N.º 29733, Ley de Protección de Datos Personales del Perú.`}
        </p>
      </header>
      {SECCIONES.map((seccion) => (
        <section key={seccion.titulo} className="flex flex-col gap-2">
          <h2 className="m-0 text-lg font-semibold">{seccion.titulo}</h2>
          {seccion.parrafos.map((parrafo) => (
            <p key={parrafo} className="m-0 leading-relaxed">
              {parrafo}
            </p>
          ))}
        </section>
      ))}
      <p className="m-0">
        <Link to="/" className="inline-flex min-h-11 items-center underline underline-offset-4">
          Volver a RestHub
        </Link>
      </p>
    </main>
  )
}
