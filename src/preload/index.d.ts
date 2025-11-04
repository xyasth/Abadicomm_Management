import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
    electronAPI: {
      getWorkers: () => Promise<any>;
      getJobdesc: () => Promise<string[]>;
      getKetua: () => Promise<string[]>;
      addSchedule: (payload: any[]) => Promise<{ ok: boolean }>;
    };
  }
}
