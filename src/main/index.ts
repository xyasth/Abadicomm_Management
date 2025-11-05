import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { readSheet, appendSheet } from "./googleSheets";
import * as bcrypt from 'bcrypt';

const saltRounds = 10;

function formatTimestampParts(timestamp: string | number) {
  if (!timestamp) return { date: "", time: "" };
  const date = new Date(Number(timestamp) * 1000); // konversi detik ke ms

  const datePart = date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });

  const timePart = date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  });

  return { date: datePart, time: timePart };
}

async function loginUser(name: string, password: string) {
  const rows = await readSheet("Worker!A2:C");

  const user = rows.find(row => {
    const sheetName = row[1];
    return sheetName === name;
  });

  if (!user) {
    throw new Error('Invalid name or password.');
  }

  const storedHash = user[2];

  const isMatch = await bcrypt.compare(password, storedHash);

  if (isMatch) {
    return { success: true, message: 'Login successful!' };
  } else {
    throw new Error('Invalid name or password.');
  }
}

async function registerUser(name: string, password: string, role: string) {

  const rows = await readSheet("Worker!A2:B");

  const names = rows.map(r => r[1]);
  if (names.includes(name)) {
    throw new Error('This name is already registered.');
  }

  const ids = rows
    .map(r => Number(r[0]))
    .filter(id => !isNaN(id));

  let maxId = 0;
  if (ids.length > 0) {
    maxId = Math.max(...ids);
  }

  const newId = maxId + 1;

  const hashedPassword = await bcrypt.hash(password, saltRounds);

  await appendSheet("Worker!A:D", [newId, name, hashedPassword, role]);

  return { success: true, message: 'Registration successful!' };
}


function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
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

  ipcMain.handle("register-user", (event, name, password, role) => {
    return registerUser(name, password, role);
  });

  ipcMain.handle("login-user", (event, name, password) => {
    return loginUser(name, password);
  });

  ipcMain.handle("get-workers", async () => {
    const rows = await readSheet("Worker!A2:D");

    return rows.map(r => ({
      id: r[0] || "",
      name: r[1] || "",
      password: r[2] || "",
      role_id: r[3] || "",
    }));
  });

  ipcMain.handle("get-schedule", async () => {
    const scheduleRows = await readSheet("Schedule!A3:G");
    const workerRows = await readSheet("Worker!A3:B");        // [id, name]
    const jobdescRows = await readSheet("Jobdesc!A3:B");        // [id, name]

    const workerMap = new Map(workerRows.map((r) => [r[0], r[1]]));
    const jobdescMap = new Map(jobdescRows.map((r) => [r[0], r[1]]));

    const schedules = scheduleRows.map((r) => {
      const start = formatTimestampParts(r[1]);
      const end = formatTimestampParts(r[2]);
      return {
        id: r[0] || "",
        worker_id: r[3] || "",
        worker_name: workerMap.get(r[3]) || "Unknown",
        jobdesc_id: r[4] || "",
        jobdesc_name: jobdescMap.get(r[4]) || "Unknown",
        supervisor_id: r[5] || "",
        supervisor_name: workerMap.get(r[5]) || "Unknown",
        tempat: r[6] || "",
        date: start.date,
        start_time: start.time,
        end_time: end.time,
      };
    });

    return schedules;
  });

  ipcMain.handle("get-jobdesc", async () => {
    const rows = await readSheet("Jobdesc!A2:A");
    return rows.map(r => r[0] || "").filter(v => v);
  });

  ipcMain.handle("get-ketua", async () => {
    const rows = await readSheet("Ketua!A2:A");
    return rows.map(r => r[0] || "").filter(v => v);
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
