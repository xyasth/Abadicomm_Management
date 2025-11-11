import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { apiService } from './apiService'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      contentSecurityPolicy: "default-src 'self'; connect-src 'self' http://127.0.0.1:8000 http://localhost:8000;",
    } as any
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  // AUTH
  ipcMain.handle("login-user", async (_, name, password) => {
    try {
      const data = await apiService.login(name, password);
      if (data.success && data.token) {
        apiService.setToken(data.token);
      }
      return data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message);
    }
  });

  ipcMain.handle("register-user", async (_, name, role, email, password, password_confirmation) => {
    try {
      const data = await apiService.register(name, role, email, password, password_confirmation);
      return data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message);
    }
  });

  // WORKERS
  ipcMain.handle("get-workers", async () => {
    try {
      return await apiService.getWorkers();
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message);
    }
  });

  ipcMain.handle("get-workers-id", async () => {
    try {
      return await apiService.getWorkersId();
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message);
    }
  });

  ipcMain.handle("get-ketua", async () => {
    try {
      return await apiService.getKetua();
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message);
    }
  });

  ipcMain.handle("add-supervisor", async (_, supervisorName: string) => {
    try {
      return await apiService.addSupervisor(supervisorName);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message);
    }
  });

  // JOBDESC
  ipcMain.handle("get-jobdesc", async () => {
    try {
      return await apiService.getJobdesc();
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message);
    }
  });

  ipcMain.handle("add-jobdesc", async (_, jobdescName: string) => {
    try {
      return await apiService.addJobdesc(jobdescName);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message);
    }
  });

  // SCHEDULE
  ipcMain.handle("get-schedule", async () => {
    try {
      return await apiService.getSchedule();
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message);
    }
  });

  ipcMain.handle("add-schedule", async (_, payload) => {
    try {
      return await apiService.addSchedule(payload);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message);
    }
  });

  ipcMain.handle("update-schedule", async (_, payload) => {
    try {
      return await apiService.updateSchedule(payload);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message);
    }
  });

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
