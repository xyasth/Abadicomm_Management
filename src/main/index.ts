import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { readSheet, appendSheet, getNextId } from "./googleSheets";
import bcrypt from 'bcryptjs';

const saltRounds = 10;

function formatTimestampParts(timestamp: string | number) {
  if (!timestamp) return { date: "", time: "" };
  const date = new Date(Number(timestamp) * 1000);

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

// Helper function to check for time conflicts
function checkTimeConflict(
  existingStart: number,
  existingEnd: number,
  newStart: number,
  newEnd: number
): boolean {
  // Check if times overlap
  // Conflict exists if:
  // - New event starts before existing ends AND
  // - New event ends after existing starts
  return newStart < existingEnd && newEnd > existingStart;
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

  ipcMain.handle("get-workers-id", async () => {
    const rows = await readSheet("Worker!A3:D");
    return rows
    .filter(r => r[3] === "2")
    .map(r => ({
      id: r[0] || "",
      name: r[1] || "",
      password: r[2] || "",
    }));
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
    const rows = await readSheet("Jobdesc!A3:B");
    return rows.map(r => ({
      id: r[0] || "",
      name: r[1] || ""
    })).filter(v => v.name);
  });

  ipcMain.handle("get-ketua", async () => {
    const rows = await readSheet("Worker!A3:D");
    return rows
      .filter(r => r[3] === "1")
      .map(r => ({
        id: r[0] || "",
        name: r[1] || ""
      }))
      .filter(v => v.name);
  });

  // ========== ADD HANDLERS ==========

  ipcMain.handle("add-jobdesc", async (_, jobdescName: string) => {
    try {
      console.log("Adding jobdesc:", jobdescName);
      const nextId = await getNextId("Jobdesc!A3:A");
      console.log("Next jobdesc ID:", nextId);

      await appendSheet("Jobdesc", [nextId.toString(), jobdescName]);
      console.log("Jobdesc added successfully");

      return { ok: true, id: nextId, name: jobdescName };
    } catch (error) {
      console.error("Error adding jobdesc:", error);
      return { ok: false, error: String(error) };
    }
  });

  ipcMain.handle("add-supervisor", async (_, supervisorName: string) => {
    try {
      console.log("Adding supervisor:", supervisorName);
      const nextId = await getNextId("Worker!A3:A");
      console.log("Next worker ID:", nextId);

      const defaultPassword = "12121212";
      const roleId = "1";

      await appendSheet("Worker", [
        nextId.toString(),
        supervisorName,
        defaultPassword,
        roleId
      ]);
      console.log("Supervisor added successfully");

      return { ok: true, id: nextId, name: supervisorName };
    } catch (error) {
      console.error("Error adding supervisor:", error);
      return { ok: false, error: String(error) };
    }
  });

  ipcMain.handle("add-schedule", async (_, payload: {
    workerId: string;
    jobdescId: string;
    supervisorId: string;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
  }) => {
    try {
      console.log("Adding schedule:", payload);

      // IMPORTANT: Convert to WIB (Asia/Jakarta, GMT+7) timezone
      // Parse the date and time as if it's in WIB, not local computer time
      const [year, month, day] = payload.date.split('-').map(Number);
      const [startHour, startMinute] = payload.startTime.split(':').map(Number);
      const [endHour, endMinute] = payload.endTime.split(':').map(Number);

      // Create date in UTC, then adjust to WIB (GMT+7 = UTC+7 hours)
      // WIB offset is 7 hours = 7 * 60 * 60 * 1000 ms = 25200000 ms
      const WIB_OFFSET = 7 * 60 * 60 * 1000;

      // Create UTC date at midnight
      const startDateUTC = Date.UTC(year, month - 1, day, startHour, startMinute, 0);
      const endDateUTC = Date.UTC(year, month - 1, day, endHour, endMinute, 0);

      // Subtract WIB offset to get the correct timestamp
      // (because UTC timestamp should represent the moment in WIB)
      const startTimestamp = Math.floor((startDateUTC - WIB_OFFSET) / 1000);
      const endTimestamp = Math.floor((endDateUTC - WIB_OFFSET) / 1000);

      console.log("Input date/time:", `${payload.date} ${payload.startTime} - ${payload.endTime}`);
      console.log("Start Timestamp (WIB):", startTimestamp);
      console.log("End Timestamp (WIB):", endTimestamp);
      console.log("Verification - Start:", new Date(startTimestamp * 1000).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }));
      console.log("Verification - End:", new Date(endTimestamp * 1000).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }));

      // Check for time conflicts with existing schedules
      const existingSchedules = await readSheet("Schedule!A3:G");

      for (const schedule of existingSchedules) {
        const scheduleWorkerId = schedule[3];
        const scheduleStart = parseInt(schedule[1]);
        const scheduleEnd = parseInt(schedule[2]);

        // Check if same worker
        if (scheduleWorkerId === payload.workerId) {
          // Check if times conflict
          if (checkTimeConflict(scheduleStart, scheduleEnd, startTimestamp, endTimestamp)) {
            // Get the conflicting schedule details for better error message (in WIB)
            const conflictStart = new Date(scheduleStart * 1000);
            const conflictEnd = new Date(scheduleEnd * 1000);

            const conflictDate = conflictStart.toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              timeZone: "Asia/Jakarta", // WIB
            });

            const conflictStartTime = conflictStart.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
              timeZone: "Asia/Jakarta", // WIB
            });

            const conflictEndTime = conflictEnd.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
              timeZone: "Asia/Jakarta", // WIB
            });

            return {
              ok: false,
              error: `Konflik waktu! Worker sudah ada jadwal pada ${conflictDate} dari ${conflictStartTime} sampai ${conflictEndTime} WIB`
            };
          }
        }
      }

      const nextId = await getNextId("Schedule!A3:A");
      console.log("Next schedule ID:", nextId);

      // Format: [Id, Waktu Mulai, Waktu Selesai, Worker_id, Jobdesc_id, Supervisor_id, Tempat]
      const row = [
        nextId.toString(),
        startTimestamp.toString(),
        endTimestamp.toString(),
        payload.workerId,
        payload.jobdescId,
        payload.supervisorId,
        payload.location
      ];

      await appendSheet("Schedule", row);
      console.log("Schedule added successfully");

      return { ok: true, id: nextId };
    } catch (error) {
      console.error("Error adding schedule:", error);
      return { ok: false, error: String(error) };
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
