import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
    electronAPI: {
      getWorkers: () => Promise<any>;
      getKetua: () => Promise<any>;
      addSchedule: (payload: any[]) => Promise<{ ok: boolean }>;
      getJobdesc: () => Promise<any>;
      getSchedule: () => Promise<any>;
      // Tambah yang lain nanti
    };
  }
}
