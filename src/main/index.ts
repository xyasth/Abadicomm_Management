import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { readSheet, appendSheet, getNextId, updateSheet } from "./googleSheets";

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

function checkTimeConflict(
  existingStart: number,
  existingEnd: number,
  newStart: number,
  newEnd: number
): boolean {
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
    const rows = await readSheet("Worker!A3:D");

    return rows.map(r => ({
      id: r[0] || "",
      name: r[1] || "",
      password: r[2] || "",
      role_id: r[3] || "",
    }));
  });

  ipcMain.handle("get-schedule", async () => {
    const scheduleRows = await readSheet("Schedule!A3:G");
    const workerRows = await readSheet("Worker!A3:B");
    const jobdescRows = await readSheet("Jobdesc!A3:B");

    const workerMap = new Map(workerRows.map((r) => [r[0], r[1]]));
    const jobdescMap = new Map(jobdescRows.map((r) => [r[0], r[1]]));

    const schedules = scheduleRows.map((r, index) => {
      const start = formatTimestampParts(r[1]);
      const end = formatTimestampParts(r[2]);
      return {
        id: r[0] || "",
        rowIndex: index + 3,
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
        raw_start_timestamp: r[1] || "",
        raw_end_timestamp: r[2] || "",
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

      const [year, month, day] = payload.date.split('-').map(Number);
      const [startHour, startMinute] = payload.startTime.split(':').map(Number);
      const [endHour, endMinute] = payload.endTime.split(':').map(Number);

      const WIB_OFFSET = 7 * 60 * 60 * 1000;

      const startDateUTC = Date.UTC(year, month - 1, day, startHour, startMinute, 0);
      const endDateUTC = Date.UTC(year, month - 1, day, endHour, endMinute, 0);

      const startTimestamp = Math.floor((startDateUTC - WIB_OFFSET) / 1000);
      const endTimestamp = Math.floor((endDateUTC - WIB_OFFSET) / 1000);

      console.log("Input date/time:", `${payload.date} ${payload.startTime} - ${payload.endTime}`);
      console.log("Start Timestamp (WIB):", startTimestamp);
      console.log("End Timestamp (WIB):", endTimestamp);

      const existingSchedules = await readSheet("Schedule!A3:G");

      for (const schedule of existingSchedules) {
        const scheduleWorkerId = schedule[3];
        const scheduleSupervisorId = schedule[5];
        const scheduleStart = parseInt(schedule[1]);
        const scheduleEnd = parseInt(schedule[2]);

        if (scheduleWorkerId === payload.workerId || scheduleSupervisorId === payload.supervisorId) {
          if (checkTimeConflict(scheduleStart, scheduleEnd, startTimestamp, endTimestamp)) {
            const conflictPerson = scheduleWorkerId === payload.workerId ? "Worker" : "Supervisor";
            const conflictStart = new Date(scheduleStart * 1000);
            const conflictEnd = new Date(scheduleEnd * 1000);

            const conflictDate = conflictStart.toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              timeZone: "Asia/Jakarta",
            });

            const conflictStartTime = conflictStart.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
              timeZone: "Asia/Jakarta",
            });

            const conflictEndTime = conflictEnd.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
              timeZone: "Asia/Jakarta",
            });

            return {
              ok: false,
              error: `Konflik waktu! ${conflictPerson} sudah ada jadwal pada ${conflictDate} dari ${conflictStartTime} sampai ${conflictEndTime} WIB`
            };
          }
        }
      }

      const nextId = await getNextId("Schedule!A3:A");
      console.log("Next schedule ID:", nextId);

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

  // FINAL STRATEGY: Update ALL rows that match the scheduleIds
  ipcMain.handle("update-schedule", async (_, payload: {
    scheduleIdsToDelete: string[];
    workerId: string;
    jobdescId: string;
    supervisorId: string;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
  }) => {
    try {
      console.log("=== UPDATE SCHEDULE (UPDATE ALL MATCHING ROWS) ===");
      console.log("Schedule IDs to update:", payload.scheduleIdsToDelete);
      console.log("New data:", {
        workerId: payload.workerId,
        jobdescId: payload.jobdescId,
        supervisorId: payload.supervisorId,
        date: payload.date,
        time: `${payload.startTime} - ${payload.endTime}`,
        location: payload.location
      });

      // Calculate new timestamps
      const [year, month, day] = payload.date.split('-').map(Number);
      const [startHour, startMinute] = payload.startTime.split(':').map(Number);
      const [endHour, endMinute] = payload.endTime.split(':').map(Number);

      const WIB_OFFSET = 7 * 60 * 60 * 1000;
      const startDateUTC = Date.UTC(year, month - 1, day, startHour, startMinute, 0);
      const endDateUTC = Date.UTC(year, month - 1, day, endHour, endMinute, 0);
      const startTimestamp = Math.floor((startDateUTC - WIB_OFFSET) / 1000);
      const endTimestamp = Math.floor((endDateUTC - WIB_OFFSET) / 1000);

      console.log("New timestamps:", { startTimestamp, endTimestamp });

      // Get all schedules and find ALL rows that need to be updated
      const scheduleRows = await readSheet("Schedule!A3:G");
      const rowsToUpdate: Array<{rowNum: number, scheduleId: string, oldData: any[]}> = [];

      scheduleRows.forEach((row, index) => {
        const scheduleId = row[0];
        if (payload.scheduleIdsToDelete.includes(scheduleId)) {
          rowsToUpdate.push({
            rowNum: index + 3,
            scheduleId: scheduleId,
            oldData: row
          });
          console.log(`Found schedule ID ${scheduleId} at row ${index + 3}`, {
            oldWorkerId: row[3],
            oldJobdescId: row[4],
            oldSupervisorId: row[5],
            oldLocation: row[6]
          });
        }
      });

      if (rowsToUpdate.length === 0) {
        console.error("No schedules found to update!");
        return { ok: false, error: "Schedule not found. Please refresh and try again." };
      }

      console.log(`Found ${rowsToUpdate.length} rows to update`);

      // Check for conflicts (excluding the rows we're updating)
      const scheduleIdsBeingUpdated = new Set(payload.scheduleIdsToDelete);

      for (const schedule of scheduleRows) {
        const scheduleId = schedule[0];

        if (scheduleIdsBeingUpdated.has(scheduleId)) {
          continue;
        }

        const scheduleWorkerId = schedule[3];
        const scheduleSupervisorId = schedule[5];
        const scheduleStart = parseInt(schedule[1]);
        const scheduleEnd = parseInt(schedule[2]);

        if (scheduleWorkerId === payload.workerId || scheduleSupervisorId === payload.supervisorId) {
          if (checkTimeConflict(scheduleStart, scheduleEnd, startTimestamp, endTimestamp)) {
            const conflictPerson = scheduleWorkerId === payload.workerId ? "Worker" : "Supervisor";
            const conflictStart = new Date(scheduleStart * 1000);
            const conflictDate = conflictStart.toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              timeZone: "Asia/Jakarta",
            });
            const conflictStartTime = conflictStart.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
              timeZone: "Asia/Jakarta",
            });
            const conflictEndTime = new Date(scheduleEnd * 1000).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
              timeZone: "Asia/Jakarta",
            });

            return {
              ok: false,
              error: `Konflik waktu! ${conflictPerson} sudah ada jadwal pada ${conflictDate} dari ${conflictStartTime} sampai ${conflictEndTime} WIB`
            };
          }
        }
      }

      // Update ALL rows with the SAME new data (timestamps, supervisor, location)
      // But keep the ORIGINAL worker_id and jobdesc_id for each row
      console.log(`Updating ${rowsToUpdate.length} rows...`);

      for (const {rowNum, scheduleId, oldData} of rowsToUpdate) {
        const updatedRow = [
          scheduleId,              // Keep same ID
          startTimestamp.toString(), // Update timestamp
          endTimestamp.toString(),   // Update timestamp
          oldData[3],              // Keep ORIGINAL worker_id
          oldData[4],              // Keep ORIGINAL jobdesc_id
          payload.supervisorId,    // Update supervisor
          payload.location         // Update location
        ];

        console.log(`Updating row ${rowNum}:`, {
          scheduleId,
          keepingWorkerId: oldData[3],
          keepingJobdescId: oldData[4],
          newSupervisor: payload.supervisorId,
          newLocation: payload.location
        });

        await updateSheet("Schedule", rowNum, updatedRow);
        console.log(`✓ Updated row ${rowNum}`);
      }

      console.log("=== UPDATE COMPLETE ===");
      return { ok: true, id: parseInt(rowsToUpdate[0].scheduleId) };
    } catch (error) {
      console.error("Error updating schedule:", error);
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
