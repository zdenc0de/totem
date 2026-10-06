import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  EMAIL_MAX,
  NOMBRE_MAX,
  TELEFONO_DIGITOS,
  esRegistroValido,
  limpiarEmail,
  limpiarNombre,
  limpiarTelefono,
  normalizarRegistro,
  validarRegistro,
  type CamposRegistro
} from '@shared/validation'
import { Modal } from '../components/Modal'
import { Teclado } from '../components/Teclado'
import { borrar, escribir, mayusculaAutomatica, type DisenoTeclado } from '../components/teclas'
import type { ScreenProps } from './types'

type CampoTexto = 'nombre' | 'apellido' | 'email' | 'telefono'

const LIMPIAR: Record<CampoTexto, (valor: string) => string> = {
  nombre: limpiarNombre,
  apellido: limpiarNombre,
  email: limpiarEmail,
  telefono: limpiarTelefono
}
const DISENO: Record<CampoTexto, DisenoTeclado> = {
  nombre: 'alfabetico',
  apellido: 'alfabetico',
  email: 'correo',
  telefono: 'numerico'
}
const SIGUIENTE: Record<CampoTexto, CampoTexto | null> = {
  nombre: 'apellido',
  apellido: 'email',
  email: 'telefono',
  telefono: null
}

// PENDIENTE del cliente: vendrá de content.json → privacidad.texto (CLAUDE.md §12).
const TEXTO_PRIVACIDAD = ''

const VACIO: CamposRegistro = {
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  aceptoPrivacidad: false
}
const NINGUNO_TOCADO: Record<keyof CamposRegistro, boolean> = {
  nombre: false,
  apellido: false,
  email: false,
  telefono: false,
  aceptoPrivacidad: false
}

// PROVISIONAL (Fase 2: falta el chequeo de correo duplicado).
export function Registro({ state, dispatch }: ScreenProps): React.JSX.Element {
  // Al volver del quiz con "Atrás" se recuperan los datos ya capturados.
  const [campos, setCampos] = useState<CamposRegistro>(state.registro ?? VACIO)
  // Un error se muestra hasta que el campo se "toca": al dejarlo con algo escrito o al
  // intentar continuar. Así no se regaña a nadie antes de empezar a escribir.
  const [tocados, setTocados] = useState(NINGUNO_TOCADO)
  // Campo que recibe lo tecleado; el teclado en pantalla está abierto mientras haya uno.
  const [activo, setActivo] = useState<CampoTexto | null>(null)
  const [verAviso, setVerAviso] = useState(false)
  const inputs = useRef<Partial<Record<CampoTexto, HTMLInputElement | null>>>({})

  const errores = validarRegistro(campos)
  const valido = esRegistroValido(errores)
  const error = (campo: keyof CamposRegistro): string | null =>
    tocados[campo] ? errores[campo] : null

  const cambiar = (campo: CampoTexto, editar: (valor: string) => string): void =>
    setCampos((prev) => ({ ...prev, [campo]: LIMPIAR[campo](editar(prev[campo])) }))

  function activar(campo: CampoTexto | null): void {
    if (campo === activo) return
    if (activo && campos[activo]) setTocados((prev) => ({ ...prev, [activo]: true }))
    setActivo(campo)
  }

  // El foco sigue al campo activo, para que el cursor se vea donde cae lo tecleado.
  useEffect(() => {
    const input = activo ? inputs.current[activo] : null
    if (input) {
      if (document.activeElement !== input) input.focus({ preventScroll: true })
      input.scrollLeft = input.scrollWidth
    } else if (document.activeElement instanceof HTMLInputElement) {
      document.activeElement.blur()
    }
  }, [activo, campos])

  function continuar(): void {
    if (!valido) {
      setTocados({
        nombre: true,
        apellido: true,
        email: true,
        telefono: true,
        aceptoPrivacidad: true
      })
      return
    }
    dispatch({ type: 'ENVIAR_REGISTRO', datos: normalizarRegistro(campos) })
  }

  return (
    <div
      className="pantalla"
      style={{ gap: 28 }}
      // Tocar fuera de los campos y del teclado lo oculta.
      onPointerDown={(e) => {
        const dentro = (e.target as Element).closest('.campo__input, .campo__etiqueta, .teclado')
        if (!dentro) activar(null)
      }}
    >
      <h2 style={{ fontSize: 80, fontWeight: 800 }}>Regístrate</h2>
      <p style={{ fontSize: 36, color: 'var(--texto-suave)', marginBottom: 20 }}>
        Completa tus datos para comenzar.
      </p>

      <Campo
        id="nombre"
        etiqueta="Nombre(s)"
        placeholder="Ej. María José"
        maxLength={NOMBRE_MAX}
        valor={campos.nombre}
        error={error('nombre')}
        activo={activo === 'nombre'}
        registrar={(el) => (inputs.current.nombre = el)}
        onActivar={() => activar('nombre')}
        onCambio={(v) => cambiar('nombre', () => v)}
      />
      <Campo
        id="apellido"
        etiqueta="Apellido"
        placeholder="Ej. López García"
        maxLength={NOMBRE_MAX}
        valor={campos.apellido}
        error={error('apellido')}
        activo={activo === 'apellido'}
        registrar={(el) => (inputs.current.apellido = el)}
        onActivar={() => activar('apellido')}
        onCambio={(v) => cambiar('apellido', () => v)}
      />
      <Campo
        id="email"
        etiqueta="Correo electrónico"
        placeholder="Ej. maria@gmail.com"
        maxLength={EMAIL_MAX}
        valor={campos.email}
        error={error('email')}
        activo={activo === 'email'}
        registrar={(el) => (inputs.current.email = el)}
        onActivar={() => activar('email')}
        onCambio={(v) => cambiar('email', () => v)}
      />
      <Campo
        id="telefono"
        etiqueta={`Teléfono (${TELEFONO_DIGITOS} dígitos)`}
        placeholder="Ej. 5512345678"
        maxLength={TELEFONO_DIGITOS}
        valor={campos.telefono}
        error={error('telefono')}
        activo={activo === 'telefono'}
        registrar={(el) => (inputs.current.telefono = el)}
        onActivar={() => activar('telefono')}
        onCambio={(v) => cambiar('telefono', () => v)}
      />

      <button
        className="boton boton--secundario"
        style={{ fontSize: 38 }}
        onClick={() => setVerAviso(true)}
      >
        Ver aviso de privacidad
      </button>
      <div className="campo">
        <button
          type="button"
          role="checkbox"
          aria-checked={campos.aceptoPrivacidad}
          aria-describedby="privacidad-error"
          className="casilla"
          onClick={() =>
            setCampos((prev) => ({ ...prev, aceptoPrivacidad: !prev.aceptoPrivacidad }))
          }
        >
          <span className="casilla__caja">
            {campos.aceptoPrivacidad && (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            )}
          </span>
          He leído y acepto el aviso de privacidad
        </button>
        <p className="campo__error" id="privacidad-error" role="alert">
          {error('aceptoPrivacidad')}
        </p>
      </div>

      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', gap: 32 }}>
        <button className="boton boton--secundario" onClick={() => dispatch({ type: 'REINICIAR' })}>
          Cancelar
        </button>
        {/* Se ve deshabilitado mientras falte algo; tocarlo muestra qué falta en vez de no hacer nada. */}
        <button className="boton" style={{ flex: 1 }} aria-disabled={!valido} onClick={continuar}>
          Continuar
        </button>
      </div>

      <AnimatePresence>
        {activo && (
          <motion.div
            className="teclado-panel"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <Teclado
              key={activo}
              diseno={DISENO[activo]}
              accion={SIGUIENTE[activo] ? 'Siguiente' : 'Listo'}
              mayusculas={DISENO[activo] === 'alfabetico' && mayusculaAutomatica(campos[activo])}
              onTexto={(texto) => cambiar(activo, (v) => escribir(v, texto))}
              onBorrar={() => cambiar(activo, borrar)}
              onAccion={() => activar(SIGUIENTE[activo])}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <Modal abierto={verAviso} titulo="Aviso de privacidad" onCerrar={() => setVerAviso(false)}>
        {TEXTO_PRIVACIDAD || <span style={{ opacity: 0.5 }}>Texto pendiente.</span>}
      </Modal>
    </div>
  )
}

type CampoProps = {
  id: CampoTexto
  etiqueta: string
  placeholder: string
  maxLength: number
  valor: string
  error: string | null
  activo: boolean
  registrar: (el: HTMLInputElement | null) => void
  onActivar: () => void
  onCambio: (valor: string) => void
}

function Campo(props: CampoProps): React.JSX.Element {
  const { id, etiqueta, placeholder, maxLength, valor, error, activo } = props
  const { registrar, onActivar, onCambio } = props
  const clases = ['campo']
  if (activo) clases.push('campo--activo')
  if (error) clases.push('campo--error')
  return (
    <div className={clases.join(' ')}>
      <label className="campo__etiqueta" htmlFor={id}>
        {etiqueta}
      </label>
      <input
        ref={registrar}
        id={id}
        className="campo__input"
        type="text"
        // Que Windows no abra su teclado táctil: el tótem usa uno propio (CLAUDE.md §10).
        inputMode="none"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        maxLength={maxLength}
        placeholder={placeholder}
        value={valor}
        aria-invalid={error !== null}
        aria-describedby={`${id}-error`}
        onPointerDown={onActivar}
        onFocus={onActivar}
        onChange={(e) => onCambio(e.target.value)}
        // El teclado escribe siempre al final: el cursor no se queda a la mitad del texto.
        onSelect={(e) => {
          const el = e.currentTarget
          const fin = el.value.length
          if (el.selectionStart !== fin || el.selectionEnd !== fin) el.setSelectionRange(fin, fin)
        }}
      />
      <p className="campo__error" id={`${id}-error`} role="alert">
        {error}
      </p>
    </div>
  )
}
