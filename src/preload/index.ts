// Única puerta entre el renderer y el proceso principal. API mínima (CLAUDE.md §9).
import { contextBridge, ipcRenderer } from 'electron'
import {
  IPC,
  type DatosGuardar,
  type Duplicados,
  type EstadoAdmin,
  type RespuestaGuardar,
  type ResultadoExportar
} from '@shared/ipc'
import type { ConfigRenderer } from '@shared/content'
import type { TotemId } from '@shared/types'

const api = {
  getConfig: (): Promise<ConfigRenderer> => ipcRenderer.invoke(IPC.configGet),
  existeDuplicado: (datos: { email: string; telefono: string }): Promise<Duplicados> =>
    ipcRenderer.invoke(IPC.existeDuplicado, datos),
  guardarRegistro: (datos: DatosGuardar): Promise<RespuestaGuardar> =>
    ipcRenderer.invoke(IPC.guardarRegistro, datos),
  admin: {
    verificarPin: (pin: string): Promise<boolean> => ipcRenderer.invoke(IPC.adminVerificarPin, pin),
    bloquear: (): Promise<void> => ipcRenderer.invoke(IPC.adminBloquear),
    estado: (): Promise<EstadoAdmin> => ipcRenderer.invoke(IPC.adminEstado),
    cambiarPin: (pin: string): Promise<boolean> => ipcRenderer.invoke(IPC.adminCambiarPin, pin),
    setTotemId: (id: TotemId): Promise<boolean> => ipcRenderer.invoke(IPC.adminSetTotemId, id),
    exportar: (): Promise<ResultadoExportar> => ipcRenderer.invoke(IPC.adminExportar),
    salir: (): Promise<void> => ipcRenderer.invoke(IPC.adminSalir)
  }
}

export type TotemApi = typeof api

contextBridge.exposeInMainWorld('totem', api)
