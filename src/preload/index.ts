import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from '@electron-toolkit/preload'

const api = {}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electronAPI", {
      getWorkers: () => ipcRenderer.invoke("get-workers"),
      getJobdesc: () => ipcRenderer.invoke("get-jobdesc"),
      getSchedule: () => ipcRenderer.invoke("get-schedule"),
      getWorkersId: () => ipcRenderer.invoke("get-workers-id"),
      getKetua: () => ipcRenderer.invoke("get-ketua"),
      addSchedule: (payload: any) => ipcRenderer.invoke("add-schedule", payload),
      addJobdesc: (name: string) => ipcRenderer.invoke("add-jobdesc", name),
      addSupervisor: (name: string) => ipcRenderer.invoke("add-supervisor", name),
      googleLoginStart: () => ipcRenderer.invoke("google-login-start"),
      login: (name: string, password: string) => ipcRenderer.invoke("login-user", name, password),
      register: (name: string, password: string, role: string, email: string) =>
        ipcRenderer.invoke("register-user", name, password, role, email),
    });

    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}
