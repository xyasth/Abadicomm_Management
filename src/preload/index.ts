import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electronAPI", {
      getWorkers: () => ipcRenderer.invoke("get-workers"),
      getJobdesc: () => ipcRenderer.invoke("get-jobdesc"),
      getKetua: () => ipcRenderer.invoke("get-ketua"),
      addSchedule: (payload: any[]) => ipcRenderer.invoke("add-schedule", payload),
      getSchedule: () => ipcRenderer.invoke("get-schedule"),

      register: (name: string, password: string, role: string) =>
        ipcRenderer.invoke("register-user", name, password, role),

      login: (name: string, password: string) =>
        ipcRenderer.invoke("login-user", name, password),
    });

    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
