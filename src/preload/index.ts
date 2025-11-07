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
      updateSchedule: (payload: any) => ipcRenderer.invoke("update-schedule", payload),
      addJobdesc: (name: string) => ipcRenderer.invoke("add-jobdesc", name),
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
