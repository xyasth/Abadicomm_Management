import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
    electronAPI: {
      getWorkers: () => Promise<any>;
      getJobdesc: () => Promise<any>;
      getSchedule: () => Promise<any>;
      // Tambah yang lain nanti
    };
  }
}
