import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

class ApiService {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Add token to requests automatically
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });
  }

  setToken(token: string) {
    this.token = token;
    console.log('✅ API Token set');
  }

  clearToken() {
    this.token = null;
    console.log('🔓 API Token cleared');
  }

  // Auth
  async login(name: string, password: string) {
    const response = await this.client.post('/auth/login', { name, password });
    return response.data;
  }

  async register(name: string, role: string, email: string, password: string, password_confirmation: string) {
    const response = await this.client.post('/auth/register', {
      name,
      role,
      email,
      password,
      password_confirmation
    });
    return response.data;
  }

  // Workers
  async getWorkers() {
    const response = await this.client.get('/v1/workers');
    return response.data;
  }

  async getWorkersId() {
    const response = await this.client.get('/v1/workers/karyawan');
    return response.data;
  }

  async getKetua() {
    const response = await this.client.get('/v1/workers/supervisors');
    return response.data;
  }

  async addSupervisor(name: string) {
    const response = await this.client.post('/v1/workers', {
      name,
      role_id: '1'
    });
    return response.data;
  }

  // Jobdesc
  async getJobdesc() {
    const response = await this.client.get('/v1/jobdescs');
    return response.data;
  }

  async addJobdesc(name: string) {
    const response = await this.client.post('/v1/jobdescs', { name });
    return response.data;
  }

  // Schedule
  async getSchedule() {
    const response = await this.client.get('/v1/schedules');
    return response.data;
  }

  async addSchedule(payload: {
    workerId: string;
    jobdescId: string;
    supervisorId: string;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
  }) {
    const response = await this.client.post('/v1/schedules', payload);
    return response.data;
  }

  // ✅ NEW: Bulk create for multiple workers
  async addScheduleBulk(payload: {
    schedules: Array<{
      workerId: string;
      jobdescId: string;
      supervisorId: string;
    }>;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
  }) {
    const response = await this.client.post('/v1/schedules/bulk', payload);
    return response.data;
  }

  // ✅ UPDATED: Bulk update for multiple workers
  async updateSchedule(payload: {
    scheduleIdsToDelete: string[];
    schedules: Array<{
      workerId: string;
      jobdescId: string;
      supervisorId: string;
    }>;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
  }) {
    const response = await this.client.put('/v1/schedules/bulk-update', payload);
    return response.data;
  }

  async deleteSchedule(id: string) {
    const response = await this.client.delete(`/v1/schedules/${id}`);
    return response.data;
  }
}

export const apiService = new ApiService();
