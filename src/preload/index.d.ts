import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
    electronAPI: {
      getWorkers: () => Promise<{ id: string; name: string; password: string }[]>;
      getKetua: () => Promise<{ id: string; name: string }[]>;
      getJobdesc: () => Promise<{ id: string; name: string }[]>;
      getSchedule: () => Promise<any>;

      // New functions
      addSchedule: (payload: {
        workerId: string;
        jobdescId: string;
        supervisorId: string;
        date: string;
        startTime: string;
        endTime: string;
        location: string;
      }) => Promise<{ ok: boolean; id?: number; error?: string }>;

      addJobdesc: (name: string) => Promise<{ ok: boolean; id?: number; name?: string; error?: string }>;

      addSupervisor: (name: string) => Promise<{ ok: boolean; id?: number; name?: string; error?: string }>;
    };
  }
}
