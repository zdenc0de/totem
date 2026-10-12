import { useEffect, useState } from 'react'
import type { EstadoAdmin } from '@shared/ipc'
import type { TotemId } from '@shared/types'
import { Teclado } from '../components/Teclado'
import { useContenido } from '../state/contenido'
import { EVENTO_ACTIVIDAD } from '../state/useInactividad'
import type { ScreenProps } from './types'

const PIN_MIN = 4
const PIN_MAX = 8

type Vista = 'pin' | 'panel' | 'nuevo-pin'

// Panel de administrador (CLAUDE.md §11). Se entra con 5 toques en la esquina y el PIN;
// main bloquea todas las funciones hasta verificarlo y vuelve a bloquearlas al salir.
export function Admin({ dispatch }: ScreenProps): React.JSX.Element {
  const [vista, setVista] = useState<Vista>('pin')
  const [estado, setEstado] = useState<EstadoAdmin | null>(null)
  const cerrar = (): void => dispatch({ type: 'CERRAR_ADMIN' })

  // Al salir del panel (botón o inactividad), main vuelve a exigir el PIN.
  useEffect(() => () => void window.totem.admin.bloquear(), [])

  const recargar = (): Promise<void> => window.totem.admin.estado().then(setEstado)

  if (vista === 'pin') {
    return (
      <EntradaPin
        titulo="Panel de administrador"
        instruccion="Escribe el PIN"
        accion="Entrar"
        onListo={async (pin) => {
          if (!(await window.totem.admin.verificarPin(pin))) return 'PIN incorrecto.'
          await recargar()
          setVista('panel')
          return null
        }}
        onCancelar={cerrar}
        cancelar="Volver"
      />
    )
  }

  if (vista === 'nuevo-pin') {
    return <CambioPin onTerminar={() => recargar().then(() => setVista('panel'))} />
  }

  return estado ? (
    <Panel
      estado={estado}
      recargar={recargar}
      onCambiarPin={() => setVista('nuevo-pin')}
      onCerrar={cerrar}
    />
  ) : (
    <div className="pantalla admin" />
  )
}

type PanelProps = {
  estado: EstadoAdmin
  recargar: () => Promise<void>
  onCambiarPin: () => void
  onCerrar: () => void
}

function Panel({ estado, recargar, onCambiarPin, onCerrar }: PanelProps): React.JSX.Element {
  const { talentos, juegos } = useContenido()
  const [exportando, setExportando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [confirmarSalida, setConfirmarSalida] = useState(false)

  // El diálogo de la USB es nativo: sus toques no llegan a la página. Mientras está abierto se
  // avisa que hay actividad para que el panel no se cierre por inactividad.
  useEffect(() => {
    if (!exportando) return
    const latido = setInterval(() => window.dispatchEvent(new Event(EVENTO_ACTIVIDAD)), 5000)
    return () => clearInterval(latido)
  }, [exportando])

  // "Salir de la app" pide un segundo toque en menos de 3 s.
  useEffect(() => {
    if (!confirmarSalida) return
    const t = setTimeout(() => setConfirmarSalida(false), 3000)
    return () => clearTimeout(t)
  }, [confirmarSalida])

  async function exportar(): Promise<void> {
    if (exportando) return
    setExportando(true)
    setMensaje(null)
    try {
      const r = await window.totem.admin.exportar()
      if (r.ok) {
        const n = r.total === 1 ? '1 registro' : `${r.total} registros`
        setMensaje(`Se exportaron ${n}:\n${r.archivos.join('\n')}`)
      } else {
        setMensaje(
          r.motivo === 'cancelado'
            ? 'Exportación cancelada.'
            : 'No se pudo exportar. Revisa la USB.'
        )
      }
    } catch {
      setMensaje('No se pudo exportar. Revisa la USB.')
    } finally {
      setExportando(false)
    }
  }

  async function elegirId(id: TotemId): Promise<void> {
    await window.totem.admin.setTotemId(id)
    await recargar()
  }

  const avisos = [
    !estado.idConfirmado && 'ID sin confirmar: elige T1 o T2 para este tótem.',
    estado.pinDeFabrica && 'El PIN sigue siendo el de fábrica. Cámbialo.',
    ...estado.qrPendiente.map((j) => `QR pendiente: ${juegos[j].nombre}.`)
  ].filter((a): a is string => Boolean(a))

  return (
    <div className="pantalla admin">
      <div className="admin__cabecera">
        <h2 className="admin__titulo">Panel de administrador</h2>
        <span className="admin__id">{estado.totemId}</span>
      </div>

      {avisos.length > 0 && (
        <ul className="admin__avisos">
          {avisos.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      )}

      <section className="admin__seccion">
        <p className="admin__subtitulo">Registros</p>
        <p className="admin__total">{estado.total}</p>
        <div className="admin__cifras">
          {(['A', 'I', 'V'] as const).map((t) => (
            <Cifra key={t} etiqueta={talentos[t].nombre} valor={estado.porTalento[t]} />
          ))}
        </div>
        <div className="admin__cifras">
          {(['simulador', 'pera'] as const).map((j) => (
            <Cifra key={j} etiqueta={juegos[j].nombre} valor={estado.porJuego[j]} />
          ))}
        </div>
      </section>

      <section className="admin__seccion">
        <p className="admin__subtitulo">ID del tótem</p>
        <div className="admin__fila">
          {(['T1', 'T2'] as const).map((id) => (
            <button
              key={id}
              className={
                estado.idConfirmado && estado.totemId === id
                  ? 'boton admin__opcion admin__opcion--activa'
                  : 'boton admin__opcion'
              }
              aria-pressed={estado.idConfirmado && estado.totemId === id}
              onClick={() => elegirId(id)}
            >
              {id}
            </button>
          ))}
        </div>
      </section>

      <section className="admin__seccion">
        <div className="admin__fila">
          <button
            className="boton boton--claro"
            style={{ flex: 1 }}
            aria-disabled={exportando}
            onClick={exportar}
          >
            {exportando ? 'Exportando…' : 'Exportar a USB'}
          </button>
          <button className="boton boton--secundario" onClick={onCambiarPin}>
            Cambiar PIN
          </button>
        </div>
        <p className="admin__mensaje" role="status">
          {mensaje}
        </p>
      </section>

      <div style={{ flex: 1 }} />
      <div className="admin__fila">
        <button className="boton boton--claro" style={{ flex: 1 }} onClick={onCerrar}>
          Volver al quiz
        </button>
        <button
          className="boton"
          style={{ flex: 1 }}
          onClick={() => (confirmarSalida ? window.totem.admin.salir() : setConfirmarSalida(true))}
        >
          {confirmarSalida ? 'Toca otra vez para salir' : 'Salir de la app'}
        </button>
      </div>
    </div>
  )
}

function Cifra({ etiqueta, valor }: { etiqueta: string; valor: number }): React.JSX.Element {
  return (
    <div className="admin__cifra">
      <span className="admin__cifra-valor">{valor}</span>
      <span className="admin__cifra-etiqueta">{etiqueta}</span>
    </div>
  )
}

function CambioPin({ onTerminar }: { onTerminar: () => void }): React.JSX.Element {
  // La misma entrada sirve para escribir y confirmar: lo tecleado se borra en cada paso y un
  // error ("No coinciden") se queda visible al volver a empezar.
  const [primero, setPrimero] = useState<string | null>(null)
  return (
    <EntradaPin
      titulo="Cambiar PIN"
      instruccion={
        primero === null
          ? `Escribe el nuevo PIN (${PIN_MIN} a ${PIN_MAX} dígitos)`
          : 'Escríbelo otra vez'
      }
      accion={primero === null ? 'Siguiente' : 'Guardar'}
      onListo={async (pin) => {
        if (primero === null) {
          setPrimero(pin)
          return null
        }
        if (pin !== primero) {
          setPrimero(null)
          return 'No coinciden. Empieza de nuevo.'
        }
        if (!(await window.totem.admin.cambiarPin(pin))) return 'No se pudo guardar el PIN.'
        onTerminar()
        return null
      }}
      onCancelar={onTerminar}
      cancelar="Cancelar"
    />
  )
}

type EntradaPinProps = {
  titulo: string
  instruccion: string
  accion: string
  /** Devuelve un mensaje de error o `null` si el PIN se aceptó. */
  onListo: (pin: string) => Promise<string | null>
  onCancelar: () => void
  cancelar: string
}

function EntradaPin(props: EntradaPinProps): React.JSX.Element {
  const { titulo, instruccion, accion, onListo, onCancelar, cancelar } = props
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [revisando, setRevisando] = useState(false)

  async function listo(): Promise<void> {
    if (revisando) return
    if (pin.length < PIN_MIN) return setError(`El PIN tiene al menos ${PIN_MIN} dígitos.`)
    setRevisando(true)
    const mensaje = await onListo(pin).catch(() => 'No se pudo revisar el PIN.')
    setRevisando(false)
    setPin('')
    setError(mensaje)
  }

  return (
    <div className="pantalla admin">
      <h2 className="admin__titulo">{titulo}</h2>
      <p className="admin__instruccion">{instruccion}</p>
      <div className="admin__puntos" aria-label={`${pin.length} dígitos`}>
        {Array.from({ length: Math.max(PIN_MIN, pin.length) }, (_, i) => (
          <span
            key={i}
            className={i < pin.length ? 'admin__punto admin__punto--lleno' : 'admin__punto'}
          />
        ))}
      </div>
      <p className="admin__error" role="alert">
        {error}
      </p>
      <div className="admin__teclado">
        <Teclado
          diseno="numerico"
          accion={accion}
          onTexto={(d) => {
            setError(null)
            setPin((p) => (p + d).slice(0, PIN_MAX))
          }}
          onBorrar={() => setPin((p) => p.slice(0, -1))}
          onAccion={listo}
        />
      </div>
      <div style={{ flex: 1 }} />
      <button
        className="boton boton--secundario"
        style={{ alignSelf: 'flex-start' }}
        onClick={onCancelar}
      >
        {cancelar}
      </button>
    </div>
  )
}
