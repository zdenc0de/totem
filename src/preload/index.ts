// Única puerta entre el renderer y el proceso principal. API mínima (CLAUDE.md §9).
import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '@shared/ipc'

const api = {
  admin: {
    salir: (): Promise<void> => ipcRenderer.invoke(IPC.adminSalir)
  }
}

export type TotemApi = typeof api

contextBridge.exposeInMainWorld('totem', api)
