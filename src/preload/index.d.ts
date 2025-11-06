import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
    electronAPI: {
      getWorkers: () => Promise<any>;
      getWorkersId: () => Promise<{ id: string; name: string; password: string }[]>;
      getKetua: () => Promise<any>;
      getJobdesc: () => Promise<any>;
      getSchedule: () => Promise<any>;
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

      googleLoginStart: () => Promise<{ success: boolean, message: string, role: string }>;
      register: (name: string, password: string, role: string) => Promise<{ success: boolean, message: string }>;
    };
  }
}
