import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
    electronAPI: {
      getWorkers: () => Promise<any>;
      getWorkersId: () => Promise<{ id: string; name: string; password: string }[]>;
      getKetua: () => Promise<any>;
      addSchedule: (payload: any[]) => Promise<{ ok: boolean }>;
      getJobdesc: () => Promise<any>;
      getSchedule: () => Promise<any>;
      register: (name: string, password: string, role: string) => Promise<any>; // Added 'role'
      login: (name: string, password: string) => Promise<any>;
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
